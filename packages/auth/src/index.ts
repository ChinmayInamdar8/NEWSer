export const ACCESS_TOKEN_COOKIE = "daily_corner_access_token"

export type AuthClient = "web" | "admin"

export function googleAuthUrl(
  apiBaseUrl: string,
  client: AuthClient
): string {
  const base = apiBaseUrl.replace(/\/$/, "")
  return `${base}/auth/google?from=${encodeURIComponent(client)}`
}
