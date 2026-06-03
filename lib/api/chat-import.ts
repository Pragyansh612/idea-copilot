const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
import { TokenManager } from '@/lib/auth/tokens'
import { parseApiError } from '@/lib/api/parse-error'
import { redirectToLogin } from '@/lib/auth/session'

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

export class ChatImportAPI {
  static async importText(source: ChatSource, rawContent: string): Promise<ChatImportResult> {
    const token = TokenManager.getAccessToken()
    const form = new FormData()
    form.append('source', source)
    form.append('raw_content', rawContent)

    const response = await fetch(`${API_URL}/api/chat/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      if (response.status === 401 && typeof window !== 'undefined') {
        await redirectToLogin(window.location.pathname)
      }
      throw new Error(parseApiError(err))
    }

    const result = await response.json()
    return result.data.import
  }

  static async importFile(source: ChatSource, file: File): Promise<ChatImportResult> {
    const token = TokenManager.getAccessToken()
    const form = new FormData()
    form.append('source', source)
    form.append('file', file)
    form.append('file_name', file.name)

    const response = await fetch(`${API_URL}/api/chat/import`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      if (response.status === 401 && typeof window !== 'undefined') {
        await redirectToLogin(window.location.pathname)
      }
      throw new Error(parseApiError(err))
    }

    const result = await response.json()
    return result.data.import
  }

  static async getImports(): Promise<ChatImportResult[]> {
    const token = TokenManager.getAccessToken()
    const response = await fetch(`${API_URL}/api/chat/imports`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(parseApiError(err))
    }
    const result = await response.json()
    return result.data.imports ?? []
  }
}
