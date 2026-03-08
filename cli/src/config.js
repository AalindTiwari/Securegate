/**
 * SecureGate CLI — Configuration & Storage
 * Manages ~/.securegate/config.json
 */

const os = require('os');
const fs = require('fs');
const path = require('path');

const CONFIG_DIR = path.join(os.homedir(), '.securegate');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const WEB_BASE_URL = process.env.SECUREGATE_WEB_URL || 'http://localhost:3000';
const API_BASE_URL = process.env.SECUREGATE_API_URL || `${WEB_BASE_URL}/v1`;
const SUPABASE_URL = process.env.SECUREGATE_SUPABASE_URL || 'http://127.0.0.1:54321';
const SUPABASE_ANON_KEY = process.env.SECUREGATE_SUPABASE_ANON_KEY || '';

function requireCliConfigValue(name, value, helpText) {
    if (value) {
        return value;
    }

    throw new Error(`${name} is not configured. ${helpText}`);
}

function ensureConfigDir() {
    if (!fs.existsSync(CONFIG_DIR)) {
        fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
}

function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_FILE)) {
            return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
        }
    } catch { }
    return {};
}

function saveConfig(config) {
    ensureConfigDir();
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2), { mode: 0o600 });
}

function getAuth() {
    const config = loadConfig();
    return config.auth || null;
}

function setAuth(auth) {
    const config = loadConfig();
    config.auth = auth;
    saveConfig(config);
}

function clearAuth() {
    const config = loadConfig();
    delete config.auth;
    saveConfig(config);
}

function getConnections() {
    const config = loadConfig();
    return config.connections || {};
}

function setConnection(connectionId, data) {
    const config = loadConfig();
    if (!config.connections) config.connections = {};
    config.connections[connectionId] = data;
    saveConfig(config);
}

function getPreferredInterface() {
    const config = loadConfig();
    return config.preferredInterface || null;
}

function setPreferredInterface(name) {
    const config = loadConfig();
    config.preferredInterface = name;
    saveConfig(config);
}

/**
 * Store the raw device fingerprint string for a given key prefix.
 * This lets `securegate env` retrieve it later for header-based device verification.
 * @param {string} keyPrefix  - First 12 chars of the SG_ key (safe to store as an index)
 * @param {string} fingerprint - The raw fingerprint string (hostname|platform|arch|cpu|mac|mem)
 */
function setDeviceFingerprint(keyPrefix, fingerprint) {
    const config = loadConfig();
    if (!config.device_fingerprints) config.device_fingerprints = {};
    config.device_fingerprints[keyPrefix] = fingerprint;
    saveConfig(config);
}

/**
 * Retrieve all stored device fingerprints keyed by key prefix.
 * Returns an object like { 'SG_abc123...': 'hostname|platform|...' }
 */
function getDeviceFingerprints() {
    const config = loadConfig();
    return config.device_fingerprints || {};
}

module.exports = {
    CONFIG_DIR,
    CONFIG_FILE,
    WEB_BASE_URL,
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    API_BASE_URL,
    // Legacy alias kept for backwards compatibility
    PROXY_BASE_URL: API_BASE_URL,
    requireCliConfigValue,
    loadConfig,
    saveConfig,
    getAuth,
    setAuth,
    clearAuth,
    getConnections,
    setConnection,
    getPreferredInterface,
    setPreferredInterface,
    setDeviceFingerprint,
    getDeviceFingerprints,
};
