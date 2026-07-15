import { isAccessTokenExpired, decodeJwtPayload } from '@/lib/auth/jwt'

/** Basic JWT shape check (three base64url segments). */
export function isJwtShape(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const parts = token.split('.')
  return parts.length === 3 && parts.every(p => p.length > 0)
}

/**
 * Access token must look like a JWT.
 * Prefer payload parse + not expired; if payload can't be decoded but shape is
 * valid (rare edge encodings), still accept so cookie sync doesn't brick auth.
 */
export function isValidAccessToken(token: string): boolean {
  const trimmed = typeof token === 'string' ? token.trim() : ''
  if (!isJwtShape(trimmed)) return false
  const payload = decodeJwtPayload(trimmed)
  if (!payload) {
    // Shape OK — allow through; proxy will re-check on dashboard entry
    return trimmed.length > 40
  }
  return !isAccessTokenExpired(trimmed)
}

/**
 * Refresh tokens from Supabase/GoTrue are often opaque (not JWTs).
 * Accept any non-empty high-entropy string without whitespace.
 */
export function isValidRefreshToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false
  const trimmed = token.trim()
  return trimmed.length >= 8 && !/\s/.test(trimmed)
}
