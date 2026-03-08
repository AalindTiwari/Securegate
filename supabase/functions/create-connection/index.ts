import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
function getEncryptionKeyMaterial() {
    const keyMaterial = Deno.env.get('ENCRYPTION_KEY');
    if (!keyMaterial || keyMaterial.length < 32) {
        throw new Error('ENCRYPTION_KEY must be set and at least 32 characters long.');
    }
    return keyMaterial;
}

async function encryptApiKey(plaintext: string): Promise<{ ciphertext: string; iv: string; authTag: string }> {
    const encoder = new TextEncoder();
    const keyMaterial = getEncryptionKeyMaterial().slice(0, 32);

    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(keyMaterial),
        { name: 'AES-GCM' },
        false,
        ['encrypt']
    );

    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoder.encode(plaintext)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const ciphertext = encryptedArray.slice(0, -16);
    const authTag = encryptedArray.slice(-16);

    return {
        ciphertext: btoa(String.fromCharCode(...ciphertext)),
        iv: btoa(String.fromCharCode(...iv)),
        authTag: btoa(String.fromCharCode(...authTag)),
    };
}

async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return new Response(
                JSON.stringify({ error: 'Missing or invalid authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const token = authHeader.replace('Bearer ', '');
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

        // 1. Verify User
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 2. Parse Request
        const body = await req.json();
        const { provider, api_key, base_url, connection_type, custom_code, variables } = body;

        if (!provider || !api_key) {
            return new Response(
                JSON.stringify({ error: 'Missing provider or api_key' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Validate custom-code connections
        const isCustomCode = connection_type === 'custom-code';
        if (isCustomCode) {
            if (!custom_code || !custom_code.trim()) {
                return new Response(
                    JSON.stringify({ error: 'Missing custom_code for custom-code connection' }),
                    { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // ─────────────────────────────────────────────────────────────
        // ─────────────────────────────────────────────────────────────

        // Count existing connections for the response payload.
        const { count: connectionCount, error: countError } = await supabaseAdmin
            .from('provider_connections')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id);

        if (countError) {
            console.error('Count error:', countError);
            return new Response(
                JSON.stringify({ error: 'Failed to check connection count' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const currentCount = connectionCount || 0;

        // ─────────────────────────────────────────────────────────────
        // 4. Encrypt API Key
        // ─────────────────────────────────────────────────────────────
        const { ciphertext, iv, authTag } = await encryptApiKey(api_key);

        // 5. Generate Connection ID
        const cleanProvider = provider.toLowerCase().replace(/[^a-z0-9]/g, '');
        const randomSuffix = Math.random().toString(36).substring(2, 8);
        const connectionId = `${cleanProvider}_${randomSuffix}`;

        // 6. Build metadata
        const metadata: Record<string, unknown> = {};

        if (base_url && base_url.trim()) {
            metadata.base_url = base_url.trim();
        }

        if (isCustomCode) {
            // Encrypt the custom code blob
            const encryptedCode = await encryptApiKey(custom_code);
            metadata.encrypted_code = encryptedCode.ciphertext;
            metadata.code_iv = encryptedCode.iv;
            metadata.code_auth_tag = encryptedCode.authTag;

            // Encrypt variables as a JSON blob
            if (variables && typeof variables === 'object' && Object.keys(variables).length > 0) {
                const encryptedVars = await encryptApiKey(JSON.stringify(variables));
                metadata.encrypted_vars = encryptedVars.ciphertext;
                metadata.vars_iv = encryptedVars.iv;
                metadata.vars_auth_tag = encryptedVars.authTag;
            }

            metadata.has_variables = variables && Object.keys(variables).length > 0;
            metadata.variable_keys = variables ? Object.keys(variables) : []; // store key names (not values) for UI display
        }

        // 7. Insert into Database (using Service Role)
        const insertData: Record<string, unknown> = {
            user_id: user.id,
            connection_id: connectionId,
            provider: provider,
            encrypted_api_key: ciphertext,
            iv,
            auth_tag: authTag,
            connection_type: isCustomCode ? 'custom-code' : 'standard',
            metadata: Object.keys(metadata).length > 0 ? metadata : null,
        };

        const { data, error: dbError } = await supabaseAdmin
            .from('provider_connections')
            .insert(insertData)
            .select()
            .single();

        if (dbError) {
            console.error('Database Error:', dbError);
            return new Response(
                JSON.stringify({ error: 'Failed to save connection' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 8. Auto-generate a security key for the new connection
        const randomKeyBytes = new Uint8Array(24);
        crypto.getRandomValues(randomKeyBytes);
        const randomKeyString = btoa(String.fromCharCode(...randomKeyBytes)).replace(/[^a-zA-Z0-9]/g, '').substring(0, 32);
        const rawSecurityKey = `SG_${randomKeyString}`;
        const keyHash = await hashKey(rawSecurityKey);

        const { error: keyError } = await supabaseAdmin
            .from('security_keys')
            .insert({
                connection_id: connectionId,
                key_hash: keyHash,
                bound_ip: 'unbound',
            });

        if (keyError) {
            console.error('Key generation error (non-fatal):', keyError);
        }

        return new Response(
            JSON.stringify({
                success: true,
                connection_id: connectionId,
                security_key: keyError ? null : rawSecurityKey,
                connection_type: isCustomCode ? 'custom-code' : 'standard',
                data,
                usage: {
                    connections_used: currentCount + 1,
                }
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Unexpected Error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
