/** Safe internal path for post-login redirects (blocks //evil.com open redirects). */
export function safeRedirectPath(raw: string | null | undefined, fallback = '/dashboard'): string {
  if (!raw) return fallback
  const path = raw.trim()
  if (!path.startsWith('/')) return fallback
  if (path.startsWith('//')) return fallback
  if (path.includes('\\') || path.includes('://')) return fallback
  return path
}
