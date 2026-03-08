/**
 * SecureGate CLI — API Client
 * Wraps all Supabase Edge Function calls
 */

const https = require('https');
const http = require('http');
const {
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    getAuth,
    setAuth,
    requireCliConfigValue,
} = require('./config');

// ── HTTP Helper ──────────────────────────────────────────────────────────────

function httpRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const lib = urlObj.protocol === 'https:' ? https : http;

        const req = lib.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(data) });
                } catch {
                    resolve({ status: res.statusCode, data });
                }
            });
        });

        req.on('error', reject);
        if (options.body) req.write(options.body);
        req.end();
    });
}

function requireAuthConfig() {
    requireCliConfigValue(
        'SECUREGATE_SUPABASE_ANON_KEY',
        SUPABASE_ANON_KEY,
        'Set SECUREGATE_SUPABASE_ANON_KEY to the anon key for your SecureGate deployment.',
    );
}

// ── Auth Helpers ─────────────────────────────────────────────────────────────

async function login(email, password) {
    requireAuthConfig();

    const res = await httpRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ email, password }),
    });

    if (res.status !== 200) {
        throw new Error(res.data?.error_description || res.data?.msg || 'Login failed');
    }

    setAuth({
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        user: {
            id: res.data.user?.id,
            // NOTE: email intentionally NOT stored to prevent leaking credentials
        },
        expires_at: Date.now() + (res.data.expires_in * 1000),
    });

    return res.data;
}

async function refreshToken() {
    requireAuthConfig();

    const auth = getAuth();
    if (!auth?.refresh_token) throw new Error('Not logged in. Run: securegate login');

    const res = await httpRequest(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ refresh_token: auth.refresh_token }),
    });

    if (res.status !== 200) {
        throw new Error('Session expired. Please run: securegate login');
    }

    setAuth({
        access_token: res.data.access_token,
        refresh_token: res.data.refresh_token,
        user: auth.user,
        expires_at: Date.now() + (res.data.expires_in * 1000),
    });

    return res.data.access_token;
}

async function getValidToken() {
    const auth = getAuth();
    if (!auth) throw new Error('Not logged in. Run: securegate login');

    // If expires_at is missing (old session) or token is about to expire (within 5 min), refresh
    if (!auth.expires_at || (Date.now() > auth.expires_at - 300000)) {
        return await refreshToken();
    }

    return auth.access_token;
}

// ── Edge Function Wrappers ───────────────────────────────────────────────────

async function authedRequest(functionName, body = null, method = 'POST', _isRetry = false) {
    requireAuthConfig();

    const token = await getValidToken();

    const options = {
        method,
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    };

    if (body) options.body = JSON.stringify(body);

    const res = await httpRequest(`${SUPABASE_URL}/functions/v1/${functionName}`, options);

    // If 403 and not already retrying, force-refresh the token and try once more
    if (res.status === 403 && !_isRetry) {
        try {
            await refreshToken();
            return authedRequest(functionName, body, method, true);
        } catch (e) {
            throw new Error('Unauthorized. Your session has expired. Run: securegate login');
        }
    }

    if (res.status === 403) {
        throw new Error('Unauthorized. Your session has expired. Run: securegate login');
    }

    return res;
}

async function listConnections() {
    return authedRequest('list-connections', null, 'GET');
}

async function getConnection(connectionId) {
    return authedRequest(`get-connection?connection_id=${connectionId}`, null, 'GET');
}

async function createConnection({ provider, apiKey, customName, baseUrl }) {
    return authedRequest('create-connection', {
        provider,
        api_key: apiKey,
        custom_name: customName,
        base_url: baseUrl,
    });
}

async function generateKey(connectionId, label) {
    const os = require('os');
    const crypto = require('crypto');

    // Generate device fingerprint
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

    const fingerprint = [
        os.hostname(), os.platform(), os.arch(),
        os.cpus()[0]?.model || 'unknown', mac,
        os.totalmem().toString(),
    ].join('|');

    const deviceFingerprint = crypto.createHash('sha256').update(fingerprint).digest('hex').substring(0, 32);

    return authedRequest('generate-key', {
        connection_id: connectionId,
        device_fingerprint: deviceFingerprint,
        label: label || `${os.hostname()} (${os.platform()})`,
    });
}

async function deleteKey(keyId) {
    // If it looks like a raw SG_ key, send it directly — the edge function
    // will hash it and find the matching key securely.
    if (keyId.startsWith('SG_') || keyId.startsWith('sg_')) {
        return authedRequest('delete-key', { raw_key: keyId });
    }
    // Otherwise treat it as a UUID key_id (legacy flow needs connection_id lookup)
    const connectionsRes = await listConnections();
    if (connectionsRes.status !== 200) {
        throw new Error('Failed to fetch connections to resolve key.');
    }
    const connections = connectionsRes.data?.connections || connectionsRes.data || [];
    let foundConnectionId = null;
    for (const conn of connections) {
        const keys = conn.security_keys || [];
        for (const key of keys) {
            if (key.id === keyId) {
                foundConnectionId = conn.connection_id;
                break;
            }
        }
        if (foundConnectionId) break;
    }
    if (!foundConnectionId) {
        throw new Error(`Key not found: ${keyId}. Run 'securegate keys list' to see available keys.`);
    }
    return authedRequest('delete-key', { key_id: keyId, connection_id: foundConnectionId });
}

async function lockKey(keyId, ip) {
    const keyField = (keyId.startsWith('SG_') || keyId.startsWith('sg_')) ? { raw_key: keyId } : { key_id: keyId };
    return authedRequest('update-key', {
        ...keyField,
        update_data: { bound_ip: ip }
    });
}

async function updateKey(keyId, updateData) {
    const keyField = (keyId.startsWith('SG_') || keyId.startsWith('sg_')) ? { raw_key: keyId } : { key_id: keyId };
    return authedRequest('update-key', {
        ...keyField,
        update_data: updateData
    });
}

module.exports = {
    login,
    refreshToken,
    getValidToken,
    listConnections,
    getConnection,
    createConnection,
    generateKey,
    deleteKey,
    lockKey,
    updateKey,
};
