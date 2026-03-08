/**
 * securegate login — Authenticate with SecureGate
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const http = require('http');
const open = require('open');
const {
  getAuth,
  setAuth,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  WEB_BASE_URL,
  getPreferredInterface,
  setPreferredInterface,
  requireCliConfigValue,
} = require('../config');

const os = require('os');

/**
 * Mask an email for safe display: "alice@gmail.com" → "a***@gmail.com"
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  const masked = local.charAt(0) + '***';
  return `${masked}@${domain}`;
}

function getNetworkCandidates() {
  const interfaces = os.networkInterfaces();
  const candidates = [];
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        candidates.push({ name, address: iface.address });
      }
    }
  }
  // Heuristic: prioritize Wi-Fi and Ethernet
  return candidates.sort((a, b) => {
    const priorityRegex = /wi-fi|ethernet|en0|wlan0|lan/i;
    const aMatch = priorityRegex.test(a.name);
    const bMatch = priorityRegex.test(b.name);
    if (aMatch && !bMatch) return -1;
    if (!aMatch && bMatch) return 1;
    return 0;
  });
}

async function loginCommand() {
  requireCliConfigValue(
    'SECUREGATE_SUPABASE_ANON_KEY',
    SUPABASE_ANON_KEY,
    'Set SECUREGATE_SUPABASE_ANON_KEY to the anon key for your SecureGate deployment.',
  );

  console.log();
  console.log(chalk.cyan.bold('🔐 SecureGate Login'));
  console.log(chalk.dim('━'.repeat(50)));
  console.log();

  // Determine host to bind to
  const args = process.argv;
  const hostFlagIndex = args.indexOf('--host');
  let bindHost = '127.0.0.1';

  if (hostFlagIndex !== -1 && args[hostFlagIndex + 1]) {
    bindHost = args[hostFlagIndex + 1];
  } else if (process.env.SECUREGATE_AUTH_HOST) {
    bindHost = process.env.SECUREGATE_AUTH_HOST;
  }

  const candidates = getNetworkCandidates();
  let localIp = '127.0.0.1';
  let chosenInterface = null;

  if (bindHost === '0.0.0.0') {
    const prefName = getPreferredInterface();
    const preferred = candidates.find(c => c.name === prefName);

    if (preferred) {
      localIp = preferred.address;
      chosenInterface = preferred.name;
    } else if (candidates.length === 1) {
      localIp = candidates[0].address;
      chosenInterface = candidates[0].name;
      setPreferredInterface(chosenInterface);
    } else if (candidates.length > 1) {
      console.log(chalk.yellow('\nMultiple network interfaces found. Please choose one:'));
      const { selection } = await inquirer.prompt([{
        type: 'list',
        name: 'selection',
        message: 'Select network interface for authentication callback:',
        choices: candidates.map(c => ({
          name: `${c.name} (${c.address})`,
          value: c
        })),
      }]);
      localIp = selection.address;
      chosenInterface = selection.name;
      setPreferredInterface(chosenInterface);
      console.log();
    }
  }

  const isRemote = bindHost !== '127.0.0.1' && bindHost !== 'localhost';

  // Check if already logged in
  const existing = getAuth();
  if (existing?.user?.email) {
    const { confirm } = await inquirer.prompt([{
      type: 'confirm',
      name: 'confirm',
      message: `Already logged in as ${chalk.cyan(existing.user.email)}. Re-authenticate?`,
      default: false,
    }]);
    if (!confirm) return;
  }

  const spinner = ora('Starting local authentication server...').start();

  return new Promise((resolve, reject) => {
    const server = http.createServer();

    server.on('request', async (req, res) => {
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
      }

      if (req.url === '/auth' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SecureGate — CLI Authentication</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: #0a0a0f;
      color: #e4e4e7;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .bg-grid {
      position: fixed; inset: 0;
      background-image: radial-gradient(rgba(99,102,241,0.08) 1px, transparent 1px);
      background-size: 32px 32px;
      z-index: 0;
    }
    .glow {
      position: fixed; top: -40%; left: 50%; transform: translateX(-50%);
      width: 600px; height: 600px;
      background: radial-gradient(circle, rgba(99,102,241,0.15), transparent 70%);
      z-index: 0;
    }
    .card {
      position: relative; z-index: 1;
      background: rgba(24,24,32,0.85);
      border: 1px solid rgba(99,102,241,0.2);
      border-radius: 20px;
      padding: 48px 40px;
      max-width: 420px;
      width: 90%;
      text-align: center;
      backdrop-filter: blur(20px);
      box-shadow: 0 0 60px rgba(99,102,241,0.08), 0 25px 50px rgba(0,0,0,0.4);
    }
    .shield { font-size: 48px; margin-bottom: 16px; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.08); } }
    .title {
      font-size: 22px; font-weight: 700; letter-spacing: -0.5px;
      background: linear-gradient(135deg, #818cf8, #6366f1, #4f46e5);
      -webkit-background-clip: text; -webkit-text-fill-color: transparent;
      margin-bottom: 8px;
    }
    .subtitle { font-size: 14px; color: #71717a; margin-bottom: 32px; }
    .spinner-wrap { display: flex; align-items: center; justify-content: center; gap: 12px; }
    .spinner {
      width: 20px; height: 20px;
      border: 2px solid rgba(99,102,241,0.2);
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .status { font-size: 14px; color: #a1a1aa; }
    .success { display: none; }
    .success .icon { font-size: 48px; margin-bottom: 12px; }
    .success .msg { font-size: 18px; font-weight: 600; color: #34d399; margin-bottom: 6px; }
    .success .hint { font-size: 13px; color: #71717a; }
    .error { display: none; }
    .error .icon { font-size: 48px; margin-bottom: 12px; }
    .error .msg { font-size: 16px; font-weight: 600; color: #f87171; margin-bottom: 6px; }
    .fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
<body>
  <div class="bg-grid"></div>
  <div class="glow"></div>
  <div class="card">
    <div id="loading">
      <div class="shield">🛡️</div>
      <div class="title">SecureGate</div>
      <div class="subtitle">CLI Authentication</div>
      <div class="spinner-wrap">
        <div class="spinner"></div>
        <span class="status">Verifying session...</span>
      </div>
    </div>
    <div id="success" class="success">
      <div class="icon">✅</div>
      <div class="msg">Authentication Successful</div>
      <div class="hint">You can close this tab and return to your terminal.</div>
    </div>
    <div id="error" class="error">
      <div class="icon">❌</div>
      <div class="msg">Authentication Failed</div>
      <div class="hint">Please try logging in again from your terminal.</div>
    </div>
  </div>
  <script>
    const hash = window.location.hash.substring(1);
    if (!hash) {
      document.getElementById('loading').style.display = 'none';
      document.getElementById('error').style.display = 'block';
      document.getElementById('error').classList.add('fade-in');
    } else {
      const params = new URLSearchParams(hash);
      const payload = {
        access_token: params.get('access_token'),
        refresh_token: params.get('refresh_token')
      };
      const host = window.location.hostname;
      const port = window.location.port;
      fetch('http://' + host + ':' + port + '/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('success').style.display = 'block';
        document.getElementById('success').classList.add('fade-in');
        setTimeout(() => window.close(), 2500);
      }).catch(() => {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
        document.getElementById('error').classList.add('fade-in');
      });
    }
  </script>
</body>
</html>`);
      } else if (req.url === '/callback' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => {
          body += chunk.toString();
        });
        req.on('end', async () => {
          try {
            const payload = JSON.parse(body);
            spinner.text = 'Verifying session...';

            const { createClient } = require('@supabase/supabase-js');
            const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
              auth: { persistSession: false }
            });

            const { data: { user }, error } = await supabaseAuth.auth.getUser(payload.access_token);

            if (error || !user) {
              throw new Error('Failed to verify user token');
            }

            setAuth({
              user: {
                id: user.id,
                // NOTE: email intentionally NOT stored to prevent leaking credentials
              },
              access_token: payload.access_token,
              refresh_token: payload.refresh_token,
              expires_at: Date.now() + (3600 * 1000),
            });

            spinner.succeed(chalk.green('Logged in successfully!'));
            console.log();
            console.log(chalk.dim(`  User: ${maskEmail(user.email)}`));
            console.log(chalk.dim(`  ID:   ${user.id.substring(0, 8)}...`));
            console.log();

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

            // Shut down cleanly — close server and exit process
            server.close(() => {
              setTimeout(() => process.exit(0), 100);
            });
            resolve();
          } catch (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: err.message }));

            spinner.fail(chalk.red(`Login failed: ${err.message}`));
            server.close(() => {
              setTimeout(() => process.exit(1), 100);
            });
            reject(err);
          }
        });
      } else {
        res.writeHead(404);
        res.end('Not Found');
      }
    });

    server.listen(0, bindHost, async () => {
      const port = server.address().port;
      const displayHost = (bindHost === '0.0.0.0' || bindHost === '::') ? localIp : bindHost;
      const authUrl = `${WEB_BASE_URL}/cli/auth?port=${port}&host=${displayHost}`;

      spinner.text = 'Opening browser to authenticate...';
      console.log(chalk.dim(`\nListening on ${chalk.yellow(bindHost)}:${port}`));
      console.log(chalk.dim(`If your browser does not open automatically, visit:\n${chalk.cyan(authUrl)}\n`));

      if (isRemote) {
        console.log(chalk.yellow(`  Note: Ensure port ${port} is open on your machine's firewall/network.\n`));
      }

      try {
        await open(authUrl);
        spinner.text = 'Waiting for browser authentication...';
      } catch (err) {
        spinner.text = 'Waiting for authentication...';
      }
    });

    server.on('error', (err) => {
      spinner.fail(chalk.red(`Failed to start local server: ${err.message}`));
      process.exitCode = 1;
      reject(err);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      if (server.listening) {
        server.close();
        spinner.fail(chalk.red('Authentication timed out.'));
        process.exitCode = 1;
        reject(new Error('Timeout'));
      }
    }, 5 * 60 * 1000);
  });
}

module.exports = loginCommand;

