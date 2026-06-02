import { redirectToLogin } from '@/lib/auth/session'
import { TokenManager } from '@/lib/auth/tokens'
import { parseApiError } from '@/lib/api/parse-error'

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
