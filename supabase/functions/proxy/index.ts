import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-fingerprint, anthropic-version, x-api-key, x-sg-signature, x-sg-timestamp',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// --------------------------------------------------------------------------------
// HELPER FUNCTIONS
// --------------------------------------------------------------------------------

async function sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function getEncryptionKeyMaterial() {
    const keyMaterial = Deno.env.get('ENCRYPTION_KEY');
    if (!keyMaterial || keyMaterial.length < 32) {
        throw new Error('ENCRYPTION_KEY must be set and at least 32 characters long.');
    }
    return keyMaterial;
}

async function decryptApiKey(encrypted: string, iv: string, authTag: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = getEncryptionKeyMaterial().slice(0, 32);

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const ciphertext = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const authTagBytes = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));

    const combined = new Uint8Array(ciphertext.length + authTagBytes.length);
    combined.set(ciphertext);
    combined.set(authTagBytes, ciphertext.length);

    try {
        const decrypted = await crypto.subtle.decrypt(
            { name: 'AES-GCM', iv: ivBytes },
            key,
            combined
        );
        return new TextDecoder().decode(decrypted);
    } catch (e) {
        throw new Error('Decryption failed');
    }
}

async function getCityFromIP(ip: string): Promise<string | null> {
    try {
        if (ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip === 'unknown') {
            return null;
        }

        // Primary: ip-api.com (HTTP, free, fast)
        const controller1 = new AbortController();
        const timeout1 = setTimeout(() => controller1.abort(), 5000);
        try {
            const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,city`, {
                signal: controller1.signal,
            });
            clearTimeout(timeout1);
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.city) {
                    console.log('[City Resolution] Primary OK:', JSON.stringify({ ip, city: data.city }));
                    return data.city;
                }
            }
        } catch (e) {
            clearTimeout(timeout1);
            console.warn('[City Resolution] Primary failed, trying fallback...', e instanceof Error ? e.message : e);
        }

        // Fallback: ipwho.is (HTTPS, free, no key)
        const controller2 = new AbortController();
        const timeout2 = setTimeout(() => controller2.abort(), 5000);
        try {
            const response = await fetch(`https://ipwho.is/${ip}`, {
                signal: controller2.signal,
            });
            clearTimeout(timeout2);
            if (response.ok) {
                const data = await response.json();
                if (data.success && data.city) {
                    console.log('[City Resolution] Fallback OK:', JSON.stringify({ ip, city: data.city }));
                    return data.city;
                }
            }
        } catch (e) {
            clearTimeout(timeout2);
            console.warn('[City Resolution] Fallback also failed:', e instanceof Error ? e.message : e);
        }

        console.warn('[City Resolution] All providers failed for IP:', ip);
        return null;
    } catch (e) {
        console.warn('[City Resolution] Unexpected error:', e instanceof Error ? e.message : e);
        return null;
    }
}

async function sendAlertEmail(userEmail: string, keyLabel: string, ip: string, reason: string) {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('SECUREGATE_FROM_EMAIL') || 'SecureGate <noreply@example.com>';
    const appUrl = Deno.env.get('APP_URL') || 'http://localhost:3000';
    if (!resendApiKey) {
        console.warn('Skipping email alert: RESEND_API_KEY not set.');
        return;
    }

    try {
        await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`
            },
            body: JSON.stringify({
                from: fromEmail,
                to: [userEmail],
                subject: '🚨 Security Alert: Unauthorized Key Usage Blocked',
                html: `
                    <h1>Security Alert</h1>
                    <p>We blocked an unauthorized attempt to use your API key.</p>
                    <ul>
                        <li><strong>Key:</strong> ${keyLabel}</li>
                        <li><strong>Reason:</strong> ${reason}</li>
                        <li><strong>Blocked IP:</strong> ${ip}</li>
                        <li><strong>Time:</strong> ${new Date().toISOString()}</li>
                    </ul>
                    <p>If this was not you, please <a href="${appUrl}/dashboard">revoke your key immediately</a>.</p>
                `
            })
        });
    } catch (e) {
        console.error('Failed to send alert email:', e);
    }
}

// --------------------------------------------------------------------------------
// MAIN HANDLER
// --------------------------------------------------------------------------------

Deno.serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(req.url);
    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        // 1. AUTHENTICATION & SECURITY CHECKS
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: { message: 'Missing or invalid authorization header.', type: 'invalid_request_error' } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const securityKey = authHeader.replace('Bearer ', '');
        // Support both old sg_ and potential new rk_ prefixes
        if (!securityKey.toLowerCase().startsWith('sg_') && !securityKey.toLowerCase().startsWith('rk_')) {
            return new Response(
                JSON.stringify({ error: { message: 'Invalid API key format. Expected sg_... or rk_...', type: 'invalid_request_error' } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const keyHash = await sha256(securityKey);

        // Step 1: Fetch Key + Connection (FK-backed join)
        const { data: keyData, error: keyError } = await supabaseAdmin
            .from('security_keys')
            .select('*, provider_connections!inner (*)')
            .eq('key_hash', keyHash)
            .eq('status', 'active')
            .single();

        if (keyError || !keyData) {
            // Log the prefix of the attempted key for debugging (first 10 chars only — never the full key)
            const attemptedPrefix = securityKey.substring(0, 10);
            console.warn('[Auth Failure] Key not found or revoked:', JSON.stringify({
                prefix: attemptedPrefix,
                path: url.pathname,
                keyError: keyError?.message || null,
            }));
            return new Response(
                JSON.stringify({ error: { message: 'Invalid API key or key revoked.', type: 'invalid_api_key', hint: `Key prefix attempted: ${attemptedPrefix}` } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const connection = keyData.provider_connections;

        // Step 2: Get email from auth.users for security alerts
        let userEmail: string | undefined;
        try {
            const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(connection.user_id);
            userEmail = authUser?.email;
        } catch { /* email is optional, used only for alerts */ }

        // Client Context
        // IP Resolution Priority:
        // 1. x-vercel-forwarded-for — set by Vercel when request goes through Vercel rewrite (usesecuregate.xyz)
        // 2. cf-connecting-ip — set by Cloudflare/Supabase for direct requests to edge functions
        // 3. x-real-ip — standard reverse proxy header
        // 4. x-forwarded-for (first entry) — generic fallback
        const xVercel = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
        const cfIp = req.headers.get('cf-connecting-ip');
        const xReal = req.headers.get('x-real-ip');
        const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();

        const clientIp = xVercel || cfIp || xReal || xff || 'unknown';

        // Debug: log IP resolution (visible in Supabase Edge Function logs)
        console.log('[IP Resolution]', JSON.stringify({
            resolved: clientIp,
            'x-vercel-forwarded-for': xVercel || null,
            'cf-connecting-ip': cfIp || null,
            'x-real-ip': xReal || null,
            'x-forwarded-for': xff || null,
        }));

        const deviceFingerprint = req.headers.get('x-device-fingerprint');
        const clientCity = await getCityFromIP(clientIp);

        // 2. DEVICE VALIDATION
        // STRICT CHECK: If this key is bound to a device, the client MUST provide the x-device-fingerprint header.
        if (keyData.device_hash) {
            if (!deviceFingerprint) {
                await supabaseAdmin.from('audit_logs').insert({
                    action: 'proxy_blocked',
                    connection_id: keyData.connection_id,
                    ip_address: clientIp,
                    metadata: { reason: 'missing_device_fingerprint' },
                });
                return new Response(
                    JSON.stringify({ error: { message: 'Access denied: Device fingerprint required. This key is locked to a specific device. Use `securegate env` to get your device fingerprint and include it as a header.', type: 'access_denied' } }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const clientDeviceHash = await sha256(deviceFingerprint);
            if (clientDeviceHash !== keyData.device_hash) {
                await supabaseAdmin.from('audit_logs').insert({
                    action: 'proxy_blocked',
                    connection_id: keyData.connection_id,
                    ip_address: clientIp,
                    metadata: { reason: 'device_mismatch' },
                });
                return new Response(
                    JSON.stringify({ error: { message: 'Access denied: Device mismatch. This key is locked to a different hardware footprint.', type: 'access_denied' } }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // 3. NETWORK VALIDATION (Always enforced — IP/city locks are never bypassed)

        // IP Lock - always enforced
        if (keyData.bound_ip && keyData.bound_ip !== 'unbound' && keyData.bound_ip !== clientIp) {
            await supabaseAdmin.from('audit_logs').insert({
                action: 'proxy_blocked',
                connection_id: keyData.connection_id,
                ip_address: clientIp,
                metadata: { reason: 'ip_mismatch', expected: keyData.bound_ip, actual: clientIp },
            });

            if (userEmail) {
                sendAlertEmail(userEmail, keyData.label || 'API Key', clientIp, `IP Address Mismatch (Expected: ${keyData.bound_ip}, Actual: ${clientIp})`);
            }

            return new Response(
                JSON.stringify({ error: { message: `Access denied: IP address mismatch. This key is locked to IP ${keyData.bound_ip}, but the request originated from ${clientIp}.`, type: 'access_denied' } }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // City Lock (Geo Lock) — always enforced when configured
        if (keyData.bound_city && keyData.bound_city !== 'unbound') {
            if (!clientCity) {
                // City lock is set but we couldn't resolve the request's city — block it.
                // This prevents bypassing city lock via VPNs, private IPs, or geo API failures.
                await supabaseAdmin.from('audit_logs').insert({
                    action: 'proxy_blocked',
                    connection_id: keyData.connection_id,
                    ip_address: clientIp,
                    metadata: { reason: 'geo_unresolvable', expected: keyData.bound_city, actual: null },
                });
                return new Response(
                    JSON.stringify({ error: { message: `Access denied: City lock is active (restricted to ${keyData.bound_city}), but your location could not be verified. Ensure you are not using a VPN or private network.`, type: 'access_denied' } }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            if (keyData.bound_city.toLowerCase() !== clientCity.toLowerCase()) {
                await supabaseAdmin.from('audit_logs').insert({
                    action: 'proxy_blocked',
                    connection_id: keyData.connection_id,
                    ip_address: clientIp,
                    metadata: { reason: 'geo_mismatch', expected: keyData.bound_city, actual: clientCity },
                });
                return new Response(
                    JSON.stringify({ error: { message: `Access denied: Location restriction. This key is restricted to ${keyData.bound_city}, but the request originated from ${clientCity}.`, type: 'access_denied' } }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        // 4. MODEL LOCK & BODY PARSING
        // IMPORTANT: We must buffer the body ONCE, then use that buffer for:
        //   a) Model enforcement (inspecting the JSON/multipart body)
        //   b) Forwarding to upstream
        // req.clone() is used only for multipart parsing (formData() drains the stream).
        // bodyBuffer is always used for upstream forwarding.
        const bodyBuffer = await req.arrayBuffer();
        const contentType = req.headers.get('content-type') || '';

        // Model enforcement (applies whenever an allow-list is configured)
        if (keyData.allowed_models && keyData.allowed_models.length > 0) {
            try {
                let requestedModel = null;

                if (contentType.includes('multipart/form-data')) {
                    // For multipart, reconstruct a Request from the buffered body to parse safely
                    const tempReq = new Request('http://localhost', {
                        method: 'POST',
                        headers: req.headers,
                        body: bodyBuffer.slice(0), // slice(0) = cheap copy
                    });
                    const formData = await tempReq.formData();
                    requestedModel = formData.get('model') as string | null;
                } else if (contentType.includes('application/json')) {
                    const text = new TextDecoder().decode(bodyBuffer);
                    if (text.trim()) {
                        const jsonBody = JSON.parse(text);
                        requestedModel = jsonBody.model;
                    }
                }

                if (requestedModel && !keyData.allowed_models.includes(requestedModel)) {
                    await supabaseAdmin.from('audit_logs').insert({
                        action: 'proxy_blocked',
                        connection_id: keyData.connection_id,
                        ip_address: clientIp,
                        metadata: { reason: 'model_mismatch', expected: keyData.allowed_models, actual: requestedModel },
                    });
                    return new Response(
                        JSON.stringify({ error: { message: `Access denied: Model '${requestedModel}' is not allowed. Allowed models are: ${keyData.allowed_models.join(', ')}.`, type: 'access_denied' } }),
                        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                    );
                }
            } catch (e) {
                // Ignore parse errors (non-JSON/non-multipart bodies are fine)
                console.warn('[Model Check] Could not parse body for model enforcement:', e instanceof Error ? e.message : e);
            }
        }

        // 5. UPSTREAM REQUEST
        const realApiKey = await decryptApiKey(
            connection.encrypted_api_key,
            connection.iv,
            connection.auth_tag
        );

        // Map Provider Config (Simplified for this file, ideally move to DB/Module)
        const PROVIDER_URLS: Record<string, string> = {
            openai: 'https://api.openai.com',
            anthropic: 'https://api.anthropic.com',
            google: 'https://generativelanguage.googleapis.com',
            groq: 'https://api.groq.com/openai',
            mistral: 'https://api.mistral.ai',
            deepseek: 'https://api.deepseek.com',
            together: 'https://api.together.xyz',
            fireworks: 'https://api.fireworks.ai/inference',
            perplexity: 'https://api.perplexity.ai',
            cohere: 'https://api.cohere.ai',
            huggingface: 'https://api-inference.huggingface.co/models',
        };

        const providerKey = connection.provider.toLowerCase();
        let baseUrl = connection.metadata?.base_url || PROVIDER_URLS[providerKey] || PROVIDER_URLS['openai'];

        // Path mapping — extract the API path from the incoming URL.
        const fullPath = url.pathname;
        const queryParams = url.search; // Includes the '?'
        const proxyPrefixMatch = fullPath.match(/\/functions\/v1\/(?:proxy|securegate)(\/.*)?$/);
        let apiPath = proxyPrefixMatch ? (proxyPrefixMatch[1] || '') : '';

        // Only default to chat/completions when NO path was specified at all
        if (apiPath === '' || apiPath === '/') {
            apiPath = '/v1/chat/completions';
        }

        // Anthropic special path mapping
        if (providerKey === 'anthropic' && apiPath.includes('/v1/chat/completions')) {
            apiPath = '/v1/messages';
        }

        // Robust URL Join: Prevent double slashes and double /v1
        const cleanBase = baseUrl.replace(/\/+$/, '');
        const cleanPath = apiPath.replace(/^\/+/, '');
        let upstreamUrl = `${cleanBase}/${cleanPath}${queryParams}`;

        // Anthropic security: ensure they see /v1/messages
        if (providerKey === 'anthropic' && !upstreamUrl.includes('/v1/')) {
            // Anthropic URLs usually DON'T have /v1 in the base domain
            // if apiPath was just 'messages', we'd need to add it, 
            // but our apiPath logic above handles typical OpenAI-to-Anthropic mapping.
        }

        // Debug: log path resolution (visible in Supabase Edge Function logs)
        console.log('[Path Resolution]', JSON.stringify({
            incomingPath: fullPath,
            resolvedApiPath: apiPath,
            upstreamUrl: upstreamUrl.replace(realApiKey, 'REDACTED'),
            provider: providerKey,
        }));

        const upstreamHeaders = new Headers();
        // Forward safe headers
        req.headers.forEach((val, key) => {
            if (!['authorization', 'host', 'content-length'].includes(key.toLowerCase())) {
                upstreamHeaders.set(key, val);
            }
        });

        // Set Auth
        if (providerKey === 'anthropic') {
            upstreamHeaders.set('x-api-key', realApiKey);
            upstreamHeaders.set('anthropic-version', '2023-06-01');
        } else if (providerKey === 'google') {
            // Google usually uses query param ?key=... but some endpoints support header.
            // For now assume header or user uses base_url with embedded key (unsafe)
            // Ideally we append ?key=REAL_KEY if it's google
            // upstreamUrl += `?key=${realApiKey}`; // Google specific handling logic needed
            // Standard Bearer for others
            upstreamHeaders.set('Authorization', `Bearer ${realApiKey}`);
        } else {
            upstreamHeaders.set('Authorization', `Bearer ${realApiKey}`);
        }

        // Only set default Content-Type for requests that have no body-related content-type.
        // CRITICAL: Never override multipart/form-data here — that would strip the boundary
        // parameter and break Whisper transcription uploads on OpenAI's side.
        const hasContentType = req.headers.has('content-type');
        const isMultipart = contentType.includes('multipart/form-data');
        if (!hasContentType && !isMultipart) {
            upstreamHeaders.set('Content-Type', 'application/json');
        }

        const start = performance.now();
        const upstreamResponse = await fetch(upstreamUrl, {
            method: req.method,
            headers: upstreamHeaders,
            body: req.method !== 'GET' && req.method !== 'HEAD' ? bodyBuffer : undefined
        });
        const duration = Math.round(performance.now() - start);

        // 6. SELF-LOCKING (AUTO-BINDING) - ONLY ON SUCCESS
        if (upstreamResponse.ok) {
            let needsUpdate = false;
            const updates: any = {};

            // IP Lock (Always active for everyone)
            if (!keyData.bound_ip || keyData.bound_ip === 'unbound') {
                updates.bound_ip = clientIp;
                keyData.bound_ip = clientIp;
                needsUpdate = true;
            }

            // City Lock (auto-binds when no explicit city restriction is set)
            if ((!keyData.bound_city || keyData.bound_city === 'unbound') && clientCity) {
                updates.bound_city = clientCity;
                keyData.bound_city = clientCity;
                needsUpdate = true;
            }

            if (needsUpdate) {
                await supabaseAdmin.from('security_keys').update(updates).eq('id', keyData.id);
            }
        }

        // Update Stats
        supabaseAdmin.from('security_keys')
            .update({ last_used_at: new Date().toISOString(), request_count: (keyData.request_count || 0) + 1 })
            .eq('id', keyData.id)
            .then();

        // Audit Log
        await supabaseAdmin.from('audit_logs').insert({
            action: 'proxy_request',
            connection_id: keyData.connection_id,
            user_id: connection.user_id,
            provider: connection.provider,
            ip_address: clientIp,
            metadata: {
                status: upstreamResponse.status,
                latency: duration,
                path: apiPath
            }
        });

        // Response
        const responseHeaders = new Headers(corsHeaders);
        upstreamResponse.headers.forEach((val, key) => {
            if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
                responseHeaders.set(key, val);
            }
        });

        // Add SecureGate Debug Headers
        responseHeaders.set('x-sg-upstream-status', upstreamResponse.status.toString());
        responseHeaders.set('x-sg-upstream-url', upstreamUrl.split('?')[0]); // Hide query params in header
        responseHeaders.set('x-sg-request-id', crypto.randomUUID());

        if (!upstreamResponse.ok) {
            console.error('[Upstream Error]', JSON.stringify({
                status: upstreamResponse.status,
                url: upstreamUrl.replace(realApiKey, 'REDACTED'),
                provider: providerKey
            }));
        }

        return new Response(upstreamResponse.body, {
            status: upstreamResponse.status,
            headers: responseHeaders
        });

    } catch (error: any) {
        console.error('Proxy Error:', error);
        return new Response(
            JSON.stringify({ error: { message: 'Internal Proxy Error', type: 'internal_server_error' } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
