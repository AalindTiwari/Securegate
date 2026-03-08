import { PUBLIC_API_URL } from "./public-config"

// SecureGate public configuration
export const SECUREGATE_CONFIG = {
    API_URL: PUBLIC_API_URL,

    get PROXY_ENDPOINT() {
        return `${this.API_URL}/functions/v1/proxy`
    },

    get BRANDED_URL() {
        return this.API_URL
    }
}

// Helper to get the proxy URL for a connection
export function getProxyURL(path: string = '/v1/chat/completions'): string {
    return `${SECUREGATE_CONFIG.PROXY_ENDPOINT}${path}`
}

// Helper to get project info without exposing Supabase
export function getProjectInfo() {
    return {
        apiEndpoint: SECUREGATE_CONFIG.BRANDED_URL,
        proxyURL: SECUREGATE_CONFIG.PROXY_ENDPOINT
    }
}
