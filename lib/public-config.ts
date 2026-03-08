const DEFAULT_APP_URL = "http://localhost:3000"

function trimTrailingSlash(value: string) {
  return value.endsWith("/") ? value.slice(0, -1) : value
}

export const PUBLIC_APP_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_APP_URL || DEFAULT_APP_URL,
)

export const PUBLIC_API_URL = trimTrailingSlash(
  process.env.NEXT_PUBLIC_SECUREGATE_API_URL || PUBLIC_APP_URL,
)

export const PUBLIC_V1_BASE_URL = `${PUBLIC_API_URL}/v1`
export const PUBLIC_RUN_CUSTOM_CODE_URL = `${PUBLIC_APP_URL}/api/functions/run-custom-code`
export const PUBLIC_DASHBOARD_URL = `${PUBLIC_APP_URL}/dashboard`
