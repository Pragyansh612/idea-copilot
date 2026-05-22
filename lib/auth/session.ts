import { TokenManager } from '@/lib/auth/tokens'
import { routes } from '@/lib/routes'

/** Clear client tokens and http-only cookies (via Next route). */
export async function clearSession(): Promise<void> {
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
