import { TokenManager } from '@/lib/auth/tokens'
import { routes } from '@/lib/routes'

function parseApiError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Request failed'
  const body = payload as { message?: string; detail?: string | { msg?: string }[] }
  if (body.message) return body.message
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail) && body.detail[0]?.msg) return body.detail[0].msg
  return 'Request failed'
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const token = TokenManager.getAccessToken()

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    if (response.status === 401 && typeof window !== 'undefined') {
      TokenManager.clearTokens()
      const path = window.location.pathname
      if (path.startsWith('/dashboard')) {
        window.location.href = `${routes.login}?redirect=${encodeURIComponent(path)}`
      }
    }
    throw new Error(parseApiError(error))
  }

  if (response.status === 204) {
    return null
  }

  return response.json()
}
