import { redirectToLogin } from '@/lib/auth/session'
import { syncAuthCookies } from '@/lib/auth/sync-cookies'
import { TokenManager } from '@/lib/auth/tokens'
import { parseApiError } from '@/lib/api/parse-error'

function applyRefreshedTokens(accessToken: string, refreshToken: string): void {
  TokenManager.setTokens(accessToken, refreshToken)
  void syncAuthCookies(accessToken, refreshToken).catch(() => {
    // Cookie sync is best-effort; localStorage tokens still work for API calls.
  })
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = TokenManager.getAccessToken()
  const refreshToken = TokenManager.getRefreshToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(refreshToken && { 'X-Refresh-Token': refreshToken }),
      ...options.headers,
    },
  })

  if (response.headers.get('X-Token-Refreshed') === 'true') {
    const newAccess = response.headers.get('X-New-Access-Token')
    const newRefresh = response.headers.get('X-New-Refresh-Token')
    if (newAccess && newRefresh) {
      applyRefreshedTokens(newAccess, newRefresh)
    }
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 401 && typeof window !== 'undefined') {
      await redirectToLogin(window.location.pathname)
    }
    throw new Error(parseApiError(error))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
