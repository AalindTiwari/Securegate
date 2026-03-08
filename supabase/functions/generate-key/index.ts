import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function hashKey(key: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(key);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
    // Handle CORS preflight requests
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
        const { connection_id, label, device_fingerprint } = await req.json();

        if (!connection_id) {
            return new Response(
                JSON.stringify({ error: 'Missing connection_id' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 3. Verify Connection Ownership
        const { data: connection, error: connError } = await supabaseAdmin
            .from('provider_connections')
            .select('id')
            .eq('connection_id', connection_id)
            .eq('user_id', user.id)
            .single();

        if (connError || !connection) {
            return new Response(
                JSON.stringify({ error: 'Connection not found or unauthorized' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 4. Generate New Key (SG_...)
        // Use 48 bytes so after stripping base64 specials (+, /, =) we always
        // have >=32 alphanumeric characters remaining.
        const randomBytes = new Uint8Array(48);
        crypto.getRandomValues(randomBytes);
        const randomString = btoa(String.fromCharCode(...randomBytes))
            .replace(/[^a-zA-Z0-9]/g, '')
            .substring(0, 32);
        // Safety check: if somehow still short, pad with more entropy
        if (randomString.length < 32) {
            throw new Error('Key generation produced insufficient entropy — retry');
        }
        const rawKey = `SG_${randomString}`;

        // 5. Hash the Key
        const keyHash = await hashKey(rawKey);

        // 6. Store Key Hash in Database (NEVER store raw key)
        const { data: keyData, error: insertError } = await supabaseAdmin
            .from('security_keys')
            .insert({
                connection_id: connection_id,
                key_hash: keyHash,
                key_prefix: rawKey.substring(0, 10),
                label: label || null,
                bound_ip: 'unbound',  // Will be bound on first use
            })
            .select()
            .single();

        if (insertError) {
            console.error('Key Insert Error:', insertError);
            return new Response(
                JSON.stringify({ error: 'Failed to generate key' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // 7. Return Raw Key (ONLY ONCE)
        return new Response(
            JSON.stringify({
                success: true,
                api_key: rawKey,
                key_id: keyData.id
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
