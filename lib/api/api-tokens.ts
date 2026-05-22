import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type ApiToken = {
  id: string
  name: string
  scopes: string[]
  created_at: string
  last_used_at?: string | null
  expires_at?: string | null
}

export class ApiTokenAPI {
  static async listTokens(): Promise<ApiToken[]> {
    const result = await fetchWithAuth(`${API_URL}/api/tokens`)
    return result.data.tokens ?? []
  }
}
