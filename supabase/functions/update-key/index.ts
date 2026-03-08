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

        const { key_id, raw_key, update_data } = await req.json();

        if ((!key_id && !raw_key) || !update_data) {
            return new Response(
                JSON.stringify({ error: 'Missing key_id/raw_key or update_data' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Build allowed updates
        const allowedUpdates: Record<string, any> = {};
        if (update_data.allowed_models !== undefined) {
            const models = update_data.allowed_models;
            if (Array.isArray(models) && models.every((m: any) => typeof m === 'string')) {
                allowedUpdates.allowed_models = models;
            } else if (models === null) {
                allowedUpdates.allowed_models = null;
            }
        }
        if (update_data.bound_ip !== undefined) {
            if (typeof update_data.bound_ip === 'string') {
                allowedUpdates.bound_ip = update_data.bound_ip;
            }
        }
        if (update_data.bound_city !== undefined) {
            if (typeof update_data.bound_city === 'string' || update_data.bound_city === null) {
                allowedUpdates.bound_city = update_data.bound_city;
            }
        }
        if (update_data.device_hash !== undefined) {
            if (typeof update_data.device_hash === 'string' || update_data.device_hash === null) {
                allowedUpdates.device_hash = update_data.device_hash;
            }
        }

        if (Object.keys(allowedUpdates).length === 0) {
            return new Response(
                JSON.stringify({ error: 'No valid update fields provided' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Resolve the key — by raw_key hash or by UUID key_id
        let resolvedKeyId: string;

        if (raw_key) {
            const keyHash = await sha256(raw_key);
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
            if ((keyData as any).provider_connections?.user_id !== user.id) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized — key does not belong to you' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            resolvedKeyId = keyData.id;
        } else {
            // Legacy: UUID key_id — verify ownership via connection
            const { data: keyData, error: keyErr } = await supabaseAdmin
                .from('security_keys')
                .select('connection_id')
                .eq('id', key_id)
                .single();

            if (keyErr || !keyData) {
                return new Response(
                    JSON.stringify({ error: 'Key not found' }),
                    { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }

            const { data: connection, error: connError } = await supabaseAdmin
                .from('provider_connections')
                .select('id')
                .eq('connection_id', keyData.connection_id)
                .eq('user_id', user.id)
                .single();

            if (connError || !connection) {
                return new Response(
                    JSON.stringify({ error: 'Unauthorized update' }),
                    { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                );
            }
            resolvedKeyId = key_id;
        }

        // Perform Update
        const { error: updateError } = await supabaseAdmin
            .from('security_keys')
            .update(allowedUpdates)
            .eq('id', resolvedKeyId);

        if (updateError) {
            console.error('Update key error:', updateError);
            return new Response(
                JSON.stringify({ error: 'Failed to update key' }),
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
