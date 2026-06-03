import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type ShareRole = 'viewer' | 'editor'

export interface Share {
  id: string
  idea_id: string
  owner_id: string
  shared_with_id: string
  shared_with_email: string | null
  role: ShareRole
  permissions: Record<string, unknown> | null
  shared_at: string
  expires_at: string | null
  is_active: boolean
}

export class ShareAPI {
  static async getShares(ideaId: string): Promise<Share[]> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/shares`)
    return result.data.shares ?? []
  }

  static async createShare(ideaId: string, email: string, role: ShareRole = 'viewer'): Promise<Share> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/share`, {
      method: 'POST',
      body: JSON.stringify({ shared_with_email: email, role }),
    })
    return result.data.share
  }

  static async updateShare(ideaId: string, shareId: string, updates: { role?: ShareRole; is_active?: boolean }): Promise<Share> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/share/${shareId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
    return result.data.share
  }

  static async revokeShare(ideaId: string, shareId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/share/${shareId}`, { method: 'DELETE' })
  }
}
