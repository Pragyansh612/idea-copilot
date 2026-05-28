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

type ApiTokenRow = {
  id: string
  token_name: string
  permissions?: string[]
  created_at: string
  last_used_at?: string | null
  expires_at?: string | null
}

function mapToken(row: ApiTokenRow): ApiToken {
  return {
    id: row.id,
    name: row.token_name,
    scopes: row.permissions ?? [],
    created_at: row.created_at,
    last_used_at: row.last_used_at,
    expires_at: row.expires_at,
  }
}

export class ApiTokenAPI {
  static async listTokens(): Promise<ApiToken[]> {
    const result = await fetchWithAuth(`${API_URL}/api/tokens`)
    const rows = (result.data.tokens ?? []) as ApiTokenRow[]
    return rows.map(mapToken)
  }

  static async createToken(name: string): Promise<{ token: ApiToken; secret: string }> {
    const result = await fetchWithAuth(`${API_URL}/api/tokens`, {
      method: 'POST',
      body: JSON.stringify({
        token_name: name,
        permissions: ['read:ideas', 'ai:query'],
      }),
    })
    const row = result.data.token as ApiTokenRow & { token: string }
    return { token: mapToken(row), secret: row.token }
  }
}
