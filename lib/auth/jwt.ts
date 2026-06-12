/** Returns true if the JWT is missing, malformed, or past expiry (5s skew). */
export function isAccessTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return true
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const payload = JSON.parse(atob(base64)) as { exp?: number }
    if (typeof payload.exp !== 'number') return false
    return payload.exp * 1000 < Date.now() - 5_000
  } catch {
    return true
  }
}
