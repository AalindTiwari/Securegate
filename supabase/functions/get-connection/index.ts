import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

        const url = new URL(req.url);
        const connectionId = url.searchParams.get('connection_id');

        if (!connectionId) {
            return new Response(
                JSON.stringify({ error: 'Missing connection ID' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // 2. Fetch connection with security keys
        const { data: connection, error: connError } = await supabaseAdmin
            .from('provider_connections')
            .select(`
                *,
                security_keys (
                    id,
                    status,
                    bound_ip,
                    bound_country,
                    device_hash,
                    allowed_models,
                    request_count,
                    last_used_at,
                    created_at,
                    key_hash
                )
            `)
            .eq('connection_id', connectionId)
            .eq('user_id', user.id)
            .single();

        if (connError || !connection) {
            return new Response(
                JSON.stringify({ error: 'Connection not found' }),
                { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Return structured data for the UI
        return new Response(
            JSON.stringify({
                connection_id: connection.connection_id,
                provider: connection.provider,
                created_at: connection.created_at,
                connection_type: connection.connection_type || 'standard',
                variable_keys: connection.metadata?.variable_keys || [],
                has_variables: connection.metadata?.has_variables || false,
                base_url: connection.metadata?.base_url || null,
                security_keys: (connection.security_keys || []).map((k: any) => ({
                    ...k,
                    key_hash: k.key_hash // Handled in UI if needed (masked)
                }))
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

    } catch (error) {
        console.error('Unexpected error:', error);
        return new Response(
            JSON.stringify({ error: 'Internal Server Error' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
