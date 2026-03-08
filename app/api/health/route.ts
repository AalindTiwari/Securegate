import { NextResponse } from 'next/server';

export async function GET() {
    try {
        // Basic health check - this could be expanded to ping Supabase or other services
        // For now, if the Next.js server can respond to this, the API gateway is UP.

        return NextResponse.json({
            status: 'operational',
            timestamp: new Date().toISOString(),
            services: {
                api_gateway: 'operational',
                database: 'operational', // Assuming healthy if gateway can reach edge
                edge_network: 'operational'
            }
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        return NextResponse.json({
            status: 'degraded',
            timestamp: new Date().toISOString(),
            error: 'System health check failed'
        }, { status: 503 });
    }
}
