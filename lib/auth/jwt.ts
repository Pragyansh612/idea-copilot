/** Decode a JWT payload segment (base64url → JSON). */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3 || !parts[1]) return null
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4)
    // atob is available in browser + Next.js edge/node runtimes
    const json = typeof atob === 'function'
      ? atob(padded)
      : Buffer.from(padded, 'base64').toString('utf8')
    const payload = JSON.parse(json)
    return payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : null
  } catch {
    return null
  }
}

/** Returns true if the JWT is missing, malformed, or past expiry (60s skew). */
export function isAccessTokenExpired(token: string): boolean {
  const payload = decodeJwtPayload(token)
  if (!payload) return true
  const exp = payload.exp
  if (typeof exp !== 'number') return false
  // Allow 60s clock skew — false "expired" here blocks cookie set after signup
  return exp * 1000 < Date.now() - 60_000
}
