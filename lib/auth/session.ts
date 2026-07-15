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

/**
 * Ensure Next.js cookies match localStorage tokens so proxy.ts can
 * allow /dashboard (localStorage alone is invisible to the edge proxy).
 */
export async function ensureAuthCookies(): Promise<boolean> {
  // Prefer raw tokens right after signup — expiry parse must not block cookie set
  const access = TokenManager.getRawAccessToken() || TokenManager.getAccessToken()
  const refresh = TokenManager.getRefreshToken()
  if (!access || !refresh) return false
  try {
    await syncAuthCookies(access, refresh)
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
