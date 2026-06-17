const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import { parseApiError } from '@/lib/api/parse-error'
import { redirectToLogin } from '@/lib/auth/session'
import { syncAuthCookies } from '@/lib/auth/sync-cookies'
import { TokenManager } from '@/lib/auth/tokens'

export type ChatSource = 'chatgpt' | 'gemini' | 'claude' | 'other'

export interface ChatImportResult {
  id: string
  user_id: string
  source: string
  file_name: string | null
  processed_summary: string | null
  ideas_extracted: number
  phases_extracted: number
  features_extracted: number
  suggestions_extracted: number
  status: string
  error_message: string | null
  created_at: string
}

function authHeaders(): Record<string, string> {
  const token = TokenManager.getAccessToken()
  const refresh = TokenManager.getRefreshToken()
  const headers: Record<string, string> = {}
  if (token) headers.Authorization = `Bearer ${token}`
  if (refresh) headers['X-Refresh-Token'] = refresh
  return headers
}

async function handleAuthResponse(response: Response): Promise<void> {
  if (response.headers.get('X-Token-Refreshed') === 'true') {
    const newAccess = response.headers.get('X-New-Access-Token')
    const newRefresh = response.headers.get('X-New-Refresh-Token')
    if (newAccess && newRefresh) {
      TokenManager.setTokens(newAccess, newRefresh)
      await syncAuthCookies(newAccess, newRefresh).catch(() => {})
    }
  }
}

async function parseAuthError(response: Response): Promise<never> {
  const err = await response.json().catch(() => ({}))
  if (response.status === 401 && typeof window !== 'undefined') {
    await redirectToLogin(window.location.pathname)
  }
  throw new Error(parseApiError(err))
}

export class ChatImportAPI {
  static async importText(source: ChatSource, rawContent: string): Promise<ChatImportResult> {
    const form = new FormData()
    form.append('source', source)
    form.append('raw_content', rawContent)

    const response = await fetch(`${API_URL}/api/chat/import`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })

    await handleAuthResponse(response)
    if (!response.ok) await parseAuthError(response)

    const result = await response.json()
    return result.data.import
  }

  static async importFile(source: ChatSource, file: File): Promise<ChatImportResult> {
    const form = new FormData()
    form.append('source', source)
    form.append('file', file)
    form.append('file_name', file.name)

    const response = await fetch(`${API_URL}/api/chat/import`, {
      method: 'POST',
      headers: authHeaders(),
      body: form,
    })

    await handleAuthResponse(response)
    if (!response.ok) await parseAuthError(response)

    const result = await response.json()
    return result.data.import
  }

  static async getImports(): Promise<ChatImportResult[]> {
    const response = await fetch(`${API_URL}/api/chat/imports`, {
      headers: authHeaders(),
    })

    await handleAuthResponse(response)
    if (!response.ok) await parseAuthError(response)

    const result = await response.json()
    return result.data.imports ?? []
  }
}
