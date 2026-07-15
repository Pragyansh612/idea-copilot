import { TokenManager } from '@/lib/auth/tokens'
import { syncAuthCookies } from '@/lib/auth/sync-cookies'
import { routes } from '@/lib/routes'

/** Clear backend session, client tokens, and Next.js auth cookies. */
export async function clearSession(): Promise<void> {
  const token =
    TokenManager.getAccessToken() || TokenManager.getRawAccessToken()
  if (token) {
    try {
      const { AuthAPI } = await import('@/lib/api/auth')
      await AuthAPI.logout(token)
    } catch {
      // ignore — still clear local session
    }
  }

  TokenManager.clearTokens()

  try {
    await fetch('/api/auth/logout', { method: 'POST' })
  } catch {
    // ignore
  }
}

/** Debounce cookie sync so navigation does not POST set-cookies every route change. */
let lastCookieSyncAt = 0
const COOKIE_SYNC_TTL_MS = 45_000

/**
 * Ensure Next.js cookies match localStorage tokens so proxy.ts can
 * allow /dashboard (localStorage alone is invisible to the edge proxy).
 * If the access JWT is expired but a refresh token remains, refresh first.
 */
export async function ensureAuthCookies(): Promise<boolean> {
  const refresh = TokenManager.getRefreshToken()
  if (!TokenManager.isAuthenticated() && refresh) {
    try {
      const { AuthAPI } = await import('@/lib/api/auth')
      const res = await AuthAPI.refreshToken(refresh)
      const session = res.data?.session
      const nextAccess = session?.access_token
      const nextRefresh = session?.refresh_token || refresh
      if (!nextAccess) return false
      TokenManager.setTokens(nextAccess, nextRefresh)
      lastCookieSyncAt = 0 // force cookie write after refresh
    } catch (err) {
      console.error('Token refresh failed', err)
      return false
    }
  }

  const access = TokenManager.getAccessToken() || TokenManager.getRawAccessToken()
  const refreshNow = TokenManager.getRefreshToken()
  if (!access || !refreshNow) return false

  const now = Date.now()
  if (now - lastCookieSyncAt < COOKIE_SYNC_TTL_MS && TokenManager.isAuthenticated()) {
    return true
  }

  try {
    await syncAuthCookies(access, refreshNow)
    lastCookieSyncAt = now
    return true
  } catch (err) {
    console.error('ensureAuthCookies failed', err)
    return false
  }
}

/** Hard-navigate into the app after tokens are ready (avoids proxy redirect loops). */
export async function enterAuthenticatedApp(path: string): Promise<void> {
  const ok = await ensureAuthCookies()
  if (!ok) {
    throw new Error('Failed to set authentication cookies')
  }
  window.location.assign(path)
}

export async function redirectToLogin(redirectPath?: string): Promise<void> {
  await clearSession()
  const path =
    redirectPath ||
    (typeof window !== 'undefined' ? window.location.pathname : '/dashboard')
  const q = path.startsWith('/dashboard') ? `?redirect=${encodeURIComponent(path)}` : ''
  window.location.href = `${routes.login}${q}`
}
