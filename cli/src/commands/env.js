/**
 * securegate env — Print the x-device-fingerprint header value for this device.
 * Architecture 2.0: just copy-paste the header into your SDK config.
 */

const chalk = require('chalk');
const os = require('os');
const crypto = require('crypto');
const { getDeviceFingerprints } = require('../config');

function computeCurrentFingerprint() {
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

    return [
        os.hostname(), os.platform(), os.arch(),
        os.cpus()[0]?.model || 'unknown', mac,
        os.totalmem().toString(),
    ].join('|');
}

async function envCommand(options = {}) {
    const stored = getDeviceFingerprints();
    const storedEntries = Object.entries(stored);

    let fingerprint;

    if (storedEntries.length === 0) {
        // No bound keys — compute live fingerprint as a preview
        fingerprint = computeCurrentFingerprint();
        console.error(chalk.yellow('\n  ⚠  No device-bound keys found. Run: securegate keys bind-device <SG_key>\n'));
    } else if (options.key) {
        const match = storedEntries.find(([k]) => k.startsWith(options.key.substring(0, 10)));
        if (!match) {
            console.error(chalk.red(`\n  No fingerprint found for key: ${options.key}\n`));
            process.exitCode = 1;
            return;
        }
        fingerprint = match[1];
    } else if (storedEntries.length === 1) {
        fingerprint = storedEntries[0][1];
    } else {
        // Multiple keys — let user pick
        const inquirer = require('inquirer');
        const { selected } = await inquirer.prompt([{
            type: 'list',
            name: 'selected',
            message: 'Which bound key?',
            choices: storedEntries.map(([k]) => ({ name: `${k}...`, value: k })),
        }]);
        fingerprint = stored[selected];
    }

    // Output ONLY the header — clean, copy-pasteable
    console.log(`x-device-fingerprint: ${fingerprint}`);
}

module.exports = envCommand;
