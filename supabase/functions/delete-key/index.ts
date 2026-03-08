import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function sha256(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
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

        // Verify user
        const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);

        if (authError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Accept: { key_id, connection_id } OR { raw_key: "SG_..." }
        const body = await req.json();
        const { key_id, connection_id, raw_key } = body;

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        if (raw_key) {
            // --- Path A: Delete by raw key (hash lookup) ---
            const keyHash = await sha256(raw_key);

            // Find the key by hash + verify ownership via connection join
            const { data: keyData, error: keyErr } = await supabaseAdmin
                .from('security_keys')
                .select('id, connection_id, provider_connections!inner(user_id)')
                .eq('key_hash', keyHash)
                .single();

            if (keyErr || !keyData) {
                return new Response(
                    JSON.stringify({ error: 'Key not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            // Verify ownership
            if ((keyData as any).provider_connections?.user_id !== user.id) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized — key does not belong to you' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const { error: deleteError } = await supabaseAdmin
                .from('security_keys')
                .delete()
                .eq('id', keyData.id);

            if (deleteError) {
                console.error('Delete key error:', deleteError);
                return new Response(
                    JSON.stringify({ error: 'Failed to delete key' }),
                    { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            return new Response(
                JSON.stringify({ success: true }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // --- Path B: Delete by key_id + connection_id (legacy) ---
        if (!key_id || !connection_id) {
            return new Response(
                JSON.stringify({ error: 'Missing key_id/connection_id or raw_key' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Verify connection ownership
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

        // Delete the specific key
        const { error: deleteError } = await supabaseAdmin
            .from('security_keys')
            .delete()
            .eq('id', key_id)
            .eq('connection_id', connection_id);

        if (deleteError) {
            console.error('Delete key error:', deleteError);
            return new Response(
                JSON.stringify({ error: 'Failed to delete key' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        return new Response(
            JSON.stringify({ success: true }),
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
