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

/**
 * Refresh tokens from Supabase/GoTrue are often opaque strings (not JWTs).
 * Accept JWT-shaped or opaque tokens with enough entropy.
 */
export function isValidRefreshToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const trimmed = token.trim()
  if (trimmed.length < 20 || /\s/.test(trimmed)) return false
  if (isJwtShape(trimmed)) return true
  // Opaque refresh token (e.g. base64 / hex / v1.* styles)
  return /^[A-Za-z0-9_\-+/=.]+$/.test(trimmed)
}
