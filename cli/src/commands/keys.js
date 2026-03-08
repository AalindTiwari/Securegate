/**
 * securegate keys — Manage security keys
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const api = require('../api');
const { setConnection, API_BASE_URL } = require('../config');

async function keysListCommand() {
    console.log();
    console.log(chalk.cyan.bold('🔑 Security Keys'));
    console.log(chalk.dim('━'.repeat(50)));

    const spinner = ora('Fetching connections...').start();

    try {
        const res = await api.listConnections();

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        const connections = res.data?.connections || res.data || [];
        spinner.stop();

        if (connections.length === 0) {
            console.log();
            console.log(chalk.dim('  No connections found.'));
            console.log(chalk.dim(`  Run: ${chalk.cyan('securegate connect')} to create one.`));
            console.log();
            return;
        }

        console.log();
        for (const conn of connections) {
            const keyCount = conn.security_keys?.length || 0;
            console.log(chalk.white.bold(`  ${conn.connection_id}`));
            console.log(chalk.dim(`    Provider: ${conn.provider}`));
            console.log(chalk.dim(`    Keys:     ${keyCount} active`));
            console.log(chalk.dim(`    Created:  ${new Date(conn.created_at).toLocaleDateString()}`));

            if (conn.security_keys?.length > 0) {
                for (const key of conn.security_keys) {
                    const preview = key.key_prefix || 'SG_***';
                    const isActive = key.status === 'active' || key.is_active === true;
                    const status = isActive ? chalk.green('● active') : chalk.red('● revoked');
                    console.log(chalk.dim(`      ${preview}  ${status}  ${key.label || 'no label'}`));

                    const locks = [];
                    if (key.bound_ip && key.bound_ip !== 'unbound') locks.push(`IP: ${key.bound_ip}`);
                    if (key.bound_city && key.bound_city !== 'unbound') locks.push(`City: ${key.bound_city}`);
                    if (key.allowed_models?.length > 0) locks.push(`Models: ${key.allowed_models.length}`);

                    if (locks.length > 0) {
                        console.log(chalk.dim(`        🔒 ${locks.join(' | ')}`));
                    }
                }
            }
            console.log();
        }
    } catch (err) {
        spinner.fail(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

async function keysCreateCommand() {
    console.log();
    console.log(chalk.cyan.bold('🔑 Generate Security Key'));
    console.log(chalk.dim('━'.repeat(50)));

    const spinner = ora('Fetching connections...').start();

    try {
        const res = await api.listConnections();
        spinner.stop();

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        const connections = res.data?.connections || res.data || [];

        if (connections.length === 0) {
            console.log();
            console.log(chalk.dim('  No connections found. Create one first:'));
            console.log(chalk.cyan('  securegate connect'));
            console.log();
            return;
        }

        const choices = connections.map(c => ({
            name: `${c.connection_id} (${c.provider})`,
            value: c.connection_id,
        }));

        console.log();
        const { connectionId, label } = await inquirer.prompt([
            {
                type: 'list',
                name: 'connectionId',
                message: 'Which connection?',
                choices,
            },
            {
                type: 'input',
                name: 'label',
                message: 'Key label (optional):',
                default: `${require('os').hostname()} CLI`,
            },
        ]);

        const genSpinner = ora('Generating security key...').start();
        const keyRes = await api.generateKey(connectionId, label);

        if (keyRes.status !== 200 && keyRes.status !== 201) {
            throw new Error(keyRes.data?.error || `Server returned ${keyRes.status}`);
        }

        genSpinner.succeed(chalk.green('Security key generated!'));

        const { security_key, bound_to, usage } = keyRes.data;

        // Save locally
        setConnection(connectionId, {
            security_key,
            provider: connections.find(c => c.connection_id === connectionId)?.provider,
            bound_to,
            created_at: new Date().toISOString(),
        });

        console.log();
        console.log(chalk.yellow.bold('  ⚠  SAVE THIS KEY — IT WILL NOT BE SHOWN AGAIN!'));
        console.log();
        console.log(chalk.dim('  Security Key:'));
        console.log(chalk.white.bold(`  ${security_key}`));
        console.log();
        if (bound_to) {
            console.log(chalk.dim(`  Bound to IP:     ${bound_to.ip || 'auto-bind on first use'}`));
            console.log(chalk.dim(`  Bound to Device: ${bound_to.device || 'this machine'}`));
        }
        console.log();
        console.log(chalk.dim('  Quick usage:'));
        console.log(chalk.dim(`  ${chalk.cyan(`baseURL: "${usage?.baseURL || API_BASE_URL}"`)}`));
        console.log(chalk.dim(`  ${chalk.cyan(`apiKey:  "${security_key.substring(0, 12)}..."`)}`));
        console.log();
    } catch (err) {
        spinner?.fail?.(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

async function keysRevokeCommand(keyId) {
    if (!keyId) {
        console.log(chalk.red('  Error: Key ID required.'));
        console.log(chalk.dim('  Usage: securegate keys revoke <key-id>'));
        return;
    }

    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Revoke key ${chalk.red(keyId)}? This cannot be undone.`,
        default: false,
    }]);

    if (!confirm) {
        console.log(chalk.dim('  Cancelled.'));
        return;
    }

    const spinner = ora('Revoking key...').start();

    try {
        const res = await api.deleteKey(keyId);

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        spinner.succeed(chalk.green('Key revoked.'));
    } catch (err) {
        spinner.fail(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

async function keysLockCommand(keyId, options) {
    if (!keyId) {
        console.log(chalk.red('  Error: Key ID required.'));
        console.log(chalk.dim('  Usage: securegate keys lock <key-id> [--ip <ip-address>]'));
        return;
    }

    const spinner = ora('Checking IP...').start();
    let ipToLock = options.ip;

    if (!ipToLock) {
        try {
            const res = await fetch('https://api.ipify.org?format=json').then(r => r.json());
            ipToLock = res.ip;
        } catch (err) {
            spinner.fail(chalk.red('Failed to detect public IP. Please specify with --ip'));
            return;
        }
    }
    spinner.stop();

    console.log();
    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Lock key ${chalk.cyan(keyId)} to IP ${chalk.yellow(ipToLock)}?`,
        default: true,
    }]);

    if (!confirm) {
        console.log(chalk.dim('  Cancelled.'));
        return;
    }

    const lockSpinner = ora('Locking key...').start();

    try {
        const res = await api.lockKey(keyId, ipToLock);

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        lockSpinner.succeed(chalk.green(`Key locked to ${ipToLock}`));
        console.log(chalk.dim('  Run `securegate keys list` to verify.'));
        console.log();
    } catch (err) {
        lockSpinner.fail(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

async function keysUpdateCommand(keyId, options) {
    if (!keyId) {
        console.log(chalk.red('  Error: Key ID required.'));
        console.log(chalk.dim('  Usage: securegate keys update <key-id> [--city <city>] [--models <model1,model2>]'));
        return;
    }

    const { city, models } = options;

    if (city === undefined && models === undefined) {
        console.log(chalk.red('  Error: Must specify at least one option to update.'));
        console.log(chalk.dim('  Usage: securegate keys update <key-id> [--city <city>] [--models <model1,model2>]'));
        return;
    }

    const updateData = {};

    if (city !== undefined) {
        updateData.bound_city = city === '' ? null : city;
    }

    if (models !== undefined) {
        updateData.allowed_models = models === '' ? [] : models.split(',').map(m => m.trim()).filter(m => m);
    }

    const spinner = ora('Updating key...').start();

    try {
        const res = await api.updateKey(keyId, updateData);

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        spinner.succeed(chalk.green(`Key ${keyId} updated successfully.`));
        if (updateData.bound_city !== undefined) {
            console.log(chalk.dim(`  City Lock: ${updateData.bound_city || 'None'}`));
        }
        if (updateData.allowed_models !== undefined) {
            console.log(chalk.dim(`  Model Lock: ${updateData.allowed_models.length > 0 ? updateData.allowed_models.join(', ') : 'None'}`));
        }
        console.log();
    } catch (err) {
        spinner.fail(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

async function keysBindDeviceCommand(keyId) {
    if (!keyId) {
        console.log(chalk.red('  Error: Key ID (SG_...) required.'));
        console.log(chalk.dim('  Usage: securegate keys bind-device <SG_key>'));
        return;
    }

    const os = require('os');
    const crypto = require('crypto');
    const { setDeviceFingerprint } = require('../config');

    // Build device fingerprint — same algorithm used by the edge function & generate-key
    const networkInterfaces = os.networkInterfaces();
    let mac = '';
    for (const [, interfaces] of Object.entries(networkInterfaces)) {
        for (const iface of interfaces) {
            if (iface.mac && iface.mac !== '00:00:00:00:00:00') {
                mac = iface.mac;
                break;
            }
        }
        if (mac) break;
    }

    const rawFingerprint = [
        os.hostname(), os.platform(), os.arch(),
        os.cpus()[0]?.model || 'unknown', mac,
        os.totalmem().toString(),
    ].join('|');

    const deviceHash = crypto.createHash('sha256').update(rawFingerprint).digest('hex');

    console.log();
    console.log(chalk.cyan.bold('🔒 Bind Device'));
    console.log(chalk.dim('━'.repeat(50)));
    console.log(chalk.dim(`  Device:      ${os.hostname()} (${os.platform()} ${os.arch()})`));
    console.log(chalk.dim(`  MAC Address: ${mac || 'not detected'}`));
    console.log(chalk.dim(`  Fingerprint: ${deviceHash.substring(0, 16)}...`));
    console.log();

    const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `Bind key ${chalk.cyan(keyId.substring(0, 15) + '...')} to this device?`,
        default: true,
    }]);

    if (!confirm) {
        console.log(chalk.dim('  Cancelled.'));
        return;
    }

    const spinner = ora('Binding device...').start();

    try {
        const res = await api.updateKey(keyId, { device_hash: deviceHash });

        if (res.status !== 200) {
            throw new Error(res.data?.error || `Server returned ${res.status}`);
        }

        // Store the RAW fingerprint locally so `securegate env` can read it
        // We key it by the first 15 chars of the sg_ key (safe, not secret)
        const keyPrefix = keyId.substring(0, 15);
        setDeviceFingerprint(keyPrefix, rawFingerprint);

        spinner.succeed(chalk.green('Device bound successfully!'));
        console.log();
        console.log(chalk.cyan.bold('  📋 How to use this key'));
        console.log(chalk.dim('  ─────────────────────────────────'));
        console.log(chalk.dim('  Add this header to every API request:'));
        console.log();
        console.log(chalk.white(`  x-device-fingerprint: ${rawFingerprint}`));
        console.log();
        console.log(chalk.yellow('  Quick setup snippets (run anytime):'));
        console.log(chalk.cyan('  $ securegate env'));
        console.log();
        console.log(chalk.dim('  Or run: securegate env --key ' + keyId.substring(0, 15) + '...'));
        console.log();
    } catch (err) {
        spinner.fail(chalk.red(`Failed: ${err.message}`));
        process.exitCode = 1;
    }
}

module.exports = { keysListCommand, keysCreateCommand, keysRevokeCommand, keysLockCommand, keysUpdateCommand, keysBindDeviceCommand };
