import { TokenManager } from '@/lib/auth/tokens'
import { routes } from '@/lib/routes'

/** Clear backend session, client tokens, and Next.js auth cookies. */
export async function clearSession(): Promise<void> {
  const token = TokenManager.getAccessToken()
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

export async function redirectToLogin(redirectPath?: string): Promise<void> {
  await clearSession()
  const path = redirectPath || (typeof window !== 'undefined' ? window.location.pathname : '/dashboard')
  const q = path.startsWith('/dashboard') ? `?redirect=${encodeURIComponent(path)}` : ''
  window.location.href = `${routes.login}${q}`
}
