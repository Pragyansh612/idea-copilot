import { isAccessTokenExpired } from '@/lib/auth/jwt'

/** Basic JWT shape check (three base64url segments). */
export function isJwtShape(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every(p => p.length > 0)
}

/** Access token must be well-formed and not expired. */
export function isValidAccessToken(token: string): boolean {
  return isJwtShape(token) && !isAccessTokenExpired(token)
}

/** Refresh token must be well-formed (may be near expiry at login boundary). */
export function isValidRefreshToken(token: string): boolean {
  return isJwtShape(token) && token.length >= 20
}
