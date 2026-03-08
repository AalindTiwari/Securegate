import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateCode, sanitizeOutput } from "./sandbox.ts";

// Maximum execution time for user code (30 seconds)
const HANDLER_TIMEOUT_MS = 30_000;

// Maximum allowed code size (50KB)
const MAX_CODE_SIZE = 50 * 1024;

/**
 * run-custom-code — Secure custom code execution engine
 *
 * This function:
 * 1. Validates the security key (same as proxy)
 * 2. Decrypts the stored code & variables from the connection metadata
 * 3. Runs the user's handler via eval() in isolated scope
 * 4. Returns the Response from the handler
 *
 * Warm for 1 hour after last request (Supabase Edge Function idle timeout).
 */

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-device-fingerprint',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
};

// SHA-256 hash
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

// Decrypt AES-GCM encrypted payload
async function decrypt(ciphertext: string, iv: string, authTag: string): Promise<string> {
    const encoder = new TextEncoder();
    const keyMaterial = getEncryptionKeyMaterial().slice(0, 32);

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        { name: 'AES-GCM' },
        false,
        ['decrypt']
    );

    const ciphertextBytes = Uint8Array.from(atob(ciphertext), c => c.charCodeAt(0));
    const ivBytes = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    const authTagBytes = Uint8Array.from(atob(authTag), c => c.charCodeAt(0));

    const combined = new Uint8Array(ciphertextBytes.length + authTagBytes.length);
    combined.set(ciphertextBytes);
    combined.set(authTagBytes, ciphertextBytes.length);

    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: ivBytes },
        key,
        combined
    );

    return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
        // ── 1. Authenticate via Security Key ──────────────────────────
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: { message: 'Missing authorization header.', type: 'invalid_request_error' } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const securityKey = authHeader.replace('Bearer ', '');
        if (!securityKey.toLowerCase().startsWith('sg_')) {
            return new Response(
                JSON.stringify({ error: { message: 'Invalid API key format. Expected sg_...', type: 'invalid_request_error' } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const keyHash = await sha256(securityKey);

        const { data: keyData, error: keyError } = await supabaseAdmin
            .from('security_keys')
            .select('*, provider_connections(*)')
            .eq('key_hash', keyHash)
            .eq('status', 'active')
            .single();

        if (keyError || !keyData) {
            return new Response(
                JSON.stringify({ error: { message: 'Invalid or revoked API key.', type: 'invalid_api_key' } }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const connection = keyData.provider_connections;

        // Ensure this is actually a custom-code connection
        if (connection.connection_type !== 'custom-code') {
            return new Response(
                JSON.stringify({ error: { message: 'This connection is not a custom-code type. Use the /proxy endpoint instead.', type: 'invalid_request_error' } }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── 2. IP Lock Enforcement (same as proxy) ────────────────────
        const xVercel = req.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim();
        const cfIp = req.headers.get('cf-connecting-ip');
        const xReal = req.headers.get('x-real-ip');
        const xff = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
        const clientIp = xVercel || cfIp || xReal || xff || 'unknown';

        console.log('[IP Resolution]', JSON.stringify({
            resolved: clientIp,
            'x-vercel-forwarded-for': xVercel || null,
            'cf-connecting-ip': cfIp || null,
            'x-real-ip': xReal || null,
            'x-forwarded-for': xff || null,
        }));

        let needsUpdate = false;
        const updates: Record<string, unknown> = {};

        if (!keyData.bound_ip || keyData.bound_ip === 'unbound') {
            updates.bound_ip = clientIp;
            keyData.bound_ip = clientIp;
            needsUpdate = true;
        }

        if (needsUpdate) {
            await supabaseAdmin
                .from('security_keys')
                .update(updates)
                .eq('id', keyData.id);
        }

        if (keyData.bound_ip && keyData.bound_ip !== clientIp) {
            return new Response(
                JSON.stringify({ error: { message: 'Access denied: IP mismatch.', type: 'access_denied' } }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── 3. Decrypt Code & Variables ───────────────────────────────
        const meta = connection.metadata;
        if (!meta || !meta.encrypted_code) {
            return new Response(
                JSON.stringify({ error: { message: 'No custom code found for this connection.', type: 'configuration_error' } }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let codeSource: string;
        try {
            codeSource = await decrypt(meta.encrypted_code, meta.code_iv, meta.code_auth_tag);
        } catch (e) {
            console.error('Code decryption failed:', e);
            return new Response(
                JSON.stringify({ error: { message: 'Failed to decrypt code. Contact support.', type: 'internal_error' } }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        let variables: Record<string, string> = {};
        if (meta.encrypted_vars) {
            try {
                const varsJson = await decrypt(meta.encrypted_vars, meta.vars_iv, meta.vars_auth_tag);
                variables = JSON.parse(varsJson);
            } catch (e) {
                console.error('Variables decryption failed:', e);
                // Non-fatal; continue with empty variables
            }
        }

        // Also inject the decrypted api_key as a convenience variable
        try {
            const apiKey = await decrypt(connection.encrypted_api_key, connection.iv, connection.auth_tag);
            if (apiKey !== '__custom_code__') {
                variables['API_KEY'] = variables['API_KEY'] || apiKey;
            }
        } catch (_) { /* ignore */ }

        // ── 3.5. Sandbox Validation ──────────────────────────────────────
        // Check code size
        if (codeSource.length > MAX_CODE_SIZE) {
            return new Response(
                JSON.stringify({ error: { message: `Code exceeds maximum size (${MAX_CODE_SIZE / 1024}KB).`, type: 'validation_error' } }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate against sandbox rules
        const validation = validateCode(codeSource);
        if (!validation.safe) {
            const violationList = validation.violations
                .map(v => `Line ${v.line || '?'}: ${v.reason}`)
                .join('\n');

            // Log the violation attempt
            await supabaseAdmin.from('audit_logs').insert({
                action: 'custom_code_blocked',
                connection_id: keyData.connection_id,
                user_id: connection.user_id,
                ip_address: clientIp,
                metadata: {
                    violation_count: validation.violations.length,
                    violations: validation.violations.slice(0, 10),
                },
            }).then();

            return new Response(
                JSON.stringify({
                    error: {
                        message: `Code blocked by security sandbox:\n${violationList}`,
                        type: 'sandbox_violation',
                        violations: validation.violations.length,
                    }
                }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // ── 4. Read Request Body ──────────────────────────────────────
        let requestBody: unknown = null;
        let bodyText = '';
        const contentType = req.headers.get('content-type') || '';

        try {
            bodyText = await req.text();
            if (bodyText && contentType.includes('application/json')) {
                requestBody = JSON.parse(bodyText);
            } else {
                requestBody = bodyText;
            }
        } catch (_) {
            requestBody = bodyText;
        }

        // Sanitized headers to pass to handler (no auth headers)
        const safeHeaders: Record<string, string> = {};
        req.headers.forEach((value: string, key: string) => {
            const lower = key.toLowerCase();
            if (!['authorization', 'host', 'x-forwarded-for', 'x-real-ip'].includes(lower)) {
                safeHeaders[key] = value;
            }
        });

        // ── 5. Execute User Code (with timeout) ──────────────────────────
        let handlerResponse: Response;
        const start = performance.now();

        try {
            const cleanCode = codeSource
                .replace(/^export\s+default\s+/m, '')
                .trim();

            let fn: Function;

            if (cleanCode.match(/^async\s+function\s+\w+\s*\(/m) || cleanCode.match(/^function\s+\w+\s*\(/m)) {
                const nameMatch = cleanCode.match(/^(?:async\s+)?function\s+(\w+)/m);
                const funcName = nameMatch?.[1] || 'handler';
                fn = eval(`(function() { ${cleanCode}; return ${funcName}; })()`);
            } else {
                fn = eval(`(${cleanCode})`);
            }

            if (typeof fn !== 'function') {
                throw new Error('Handler must be a function. Make sure your code defines an async function.');
            }

            // Run with timeout
            const executionPromise = fn({
                variables,
                requestBody,
                requestHeaders: safeHeaders,
                requestMethod: req.method,
            });

            const timeoutPromise = new Promise<never>((_, reject) => {
                setTimeout(() => reject(new Error(`Execution timed out after ${HANDLER_TIMEOUT_MS / 1000}s`)), HANDLER_TIMEOUT_MS);
            });

            handlerResponse = await Promise.race([executionPromise, timeoutPromise]);

            if (!(handlerResponse instanceof Response)) {
                handlerResponse = new Response(
                    JSON.stringify(handlerResponse),
                    { status: 200, headers: { 'Content-Type': 'application/json' } }
                );
            }
        } catch (execError: unknown) {
            const rawMsg = execError instanceof Error ? execError.message : String(execError);
            const msg = sanitizeOutput(rawMsg);
            console.error('Handler execution error:', msg);

            // Log the failure
            await supabaseAdmin.from('audit_logs').insert({
                action: 'custom_code_error',
                connection_id: keyData.connection_id,
                user_id: connection.user_id,
                ip_address: clientIp,
                metadata: { error: msg.slice(0, 500) },
            }).then();

            return new Response(
                JSON.stringify({ error: { message: `Handler error: ${msg}`, type: 'handler_execution_error' } }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }


        const duration = Math.round(performance.now() - start);

        // ── 6. Update Usage Stats & Log ───────────────────────────────
        supabaseAdmin
            .from('security_keys')
            .update({
                last_used_at: new Date().toISOString(),
                request_count: (keyData.request_count || 0) + 1
            })
            .eq('id', keyData.id)
            .then();

        supabaseAdmin.from('audit_logs').insert({
            action: 'custom_code_request',
            connection_id: keyData.connection_id,
            user_id: connection.user_id, // Include user_id
            provider: connection.provider,
            ip_address: clientIp,
            metadata: {
                status: handlerResponse.status,
                latency_ms: duration,
            },
        }).then();

        // ── 7. Return Handler's Response with CORS headers ────────────
        const responseHeaders = new Headers(corsHeaders);
        handlerResponse.headers.forEach((value, key) => {
            if (!['content-encoding', 'content-length'].includes(key.toLowerCase())) {
                responseHeaders.set(key, value);
            }
        });

        return new Response(handlerResponse.body, {
            status: handlerResponse.status,
            headers: responseHeaders,
        });

    } catch (error) {
        console.error('run-custom-code fatal error:', error);
        return new Response(
            JSON.stringify({ error: { message: 'Internal Server Error', type: 'internal_server_error' } }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
