#!/usr/bin/env node

/**
 * SecureGate CLI v2.4
 * Secure your AI agent API keys from the terminal.
 * 
 * Usage:
 *   securegate login                  Authenticate with SecureGate
 *   securegate connect                Connect a new AI provider  
 *   securegate keys [list|create|update|revoke|bind-device]  Manage security keys
 *   securegate env                    Show device header snippets for Python/Node/curl
 *   securegate providers              List supported providers
 *   securegate status                 Show account status
 *   securegate logout                 Clear stored credentials
 */

const { Command } = require('commander');
const chalk = require('chalk');
const { clearAuth, getAuth, WEB_BASE_URL } = require('./config');

const program = new Command();

program
    .name('securegate')
    .description(chalk.cyan('🔐 SecureGate CLI') + ' — Secure your AI agent API keys')
    .version('2.4.1');

// ── login ────────────────────────────────────────────────────────────────────

program
    .command('login')
    .description('Authenticate with your SecureGate account')
    .action(async () => {
        const loginCmd = require('./commands/login');
        await loginCmd();
    });

// ── connect ──────────────────────────────────────────────────────────────────

program
    .command('connect')
    .description('Connect a new AI provider (OpenAI, Anthropic, etc.)')
    .action(async () => {
        const connectCmd = require('./commands/connect');
        await connectCmd();
    });

// ── keys ─────────────────────────────────────────────────────────────────────

const keysCmd = program
    .command('keys')
    .description('Manage security keys');

keysCmd
    .command('list')
    .description('List all connections and their security keys')
    .action(async () => {
        const { keysListCommand } = require('./commands/keys');
        await keysListCommand();
    });

keysCmd
    .command('create')
    .description('Generate a new security key for a connection')
    .action(async () => {
        const { keysCreateCommand } = require('./commands/keys');
        await keysCreateCommand();
    });

keysCmd
    .command('update <key-id>')
    .description('Update an existing security key')
    .option('--city <city>', 'Restrict key to a specific city')
    .option('--models <model1,model2>', 'Comma separated list of allowed models')
    .action(async (keyId, options) => {
        const { keysUpdateCommand } = require('./commands/keys');
        await keysUpdateCommand(keyId, options);
    });

keysCmd
    .command('lock <key-id>')
    .description('Lock a security key to an IP')
    .option('--ip <ip-address>', 'Specific IP address to lock to')
    .action(async (keyId, options) => {
        const { keysLockCommand } = require('./commands/keys');
        await keysLockCommand(keyId, options);
    });

keysCmd
    .command('revoke <key-id>')
    .description('Revoke a security key')
    .action(async (keyId) => {
        const { keysRevokeCommand } = require('./commands/keys');
        await keysRevokeCommand(keyId);
    });

keysCmd
    .command('bind-device <key-id>')
    .description('Bind a security key to this device')
    .action(async (keyId) => {
        const { keysBindDeviceCommand } = require('./commands/keys');
        await keysBindDeviceCommand(keyId);
    });

// Default: list keys
keysCmd
    .action(async () => {
        const { keysListCommand } = require('./commands/keys');
        await keysListCommand();
    });

// ── env ──────────────────────────────────────────────────────────────────────

program
    .command('env')
    .description('Show device fingerprint header snippets for Python, Node, curl, etc.')
    .option('--key <prefix>', 'Show snippet for a specific key prefix')
    .action(async (options) => {
        const envCmd = require('./commands/env');
        await envCmd(options);
    });

// ── providers ────────────────────────────────────────────────────────────────

program
    .command('providers')
    .description('List all supported AI providers')
    .action(() => {
        const providersCmd = require('./commands/providers');
        providersCmd();
    });

// ── status ───────────────────────────────────────────────────────────────────

program
    .command('status')
    .description('Show current account and connection status')
    .action(async () => {
        const statusCmd = require('./commands/status');
        await statusCmd();
    });

// ── logout ───────────────────────────────────────────────────────────────────

program
    .command('logout')
    .description('Clear stored credentials')
    .action(() => {
        const auth = require('./config').getAuth();
        if (!auth) {
            console.log(require('chalk').dim('\n  Already logged out.\n'));
            return;
        }
        require('./config').clearAuth();
        console.log(require('chalk').green('\n  ✓ Logged out. Credentials cleared.\n'));
    });

// ── Banner ───────────────────────────────────────────────────────────────────

program.addHelpText('beforeAll', `
${chalk.cyan.bold('🔐 SecureGate CLI v2.4.1')}
${chalk.dim('━'.repeat(50))}
${chalk.dim('Protect your AI agent API keys with hardware-grade security.')}
${chalk.dim(WEB_BASE_URL)}
`);

program.addHelpText('afterAll', `
${chalk.dim('━'.repeat(50))}
${chalk.dim('Quick start:')}
  ${chalk.cyan('securegate login')}              ${chalk.dim('Sign in to your account')}
  ${chalk.cyan('securegate connect')}            ${chalk.dim('Add an AI provider')}
  ${chalk.cyan('securegate keys bind-device')}   ${chalk.dim('Lock a key to this machine')}
  ${chalk.cyan('securegate env')}                ${chalk.dim('Get header snippets for your SDK')}

`);

// ── Parse ────────────────────────────────────────────────────────────────────

program.parse(process.argv);

// Show help if no command
if (!process.argv.slice(2).length) {
    program.help();
}
