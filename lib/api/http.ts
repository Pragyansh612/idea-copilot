import { redirectToLogin } from '@/lib/auth/session'
import { TokenManager } from '@/lib/auth/tokens'

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
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  })

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
