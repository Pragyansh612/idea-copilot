import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Comment {
  id: string
  user_id: string
  author_email: string | null
  idea_id: string | null
  feature_id: string | null
  parent_comment_id: string | null
  content: string
  is_ai_generated: boolean
  created_at: string
  updated_at: string
  replies: Comment[]
}

export class CommentAPI {
  static async getIdeaComments(ideaId: string, limit = 50, offset = 0): Promise<Comment[]> {
    const result = await fetchWithAuth(
      `${API_URL}/api/ideas/${ideaId}/comments?limit=${limit}&offset=${offset}`
    )
    return result.data.comments ?? []
  }

  static async createIdeaComment(ideaId: string, content: string, parentId?: string): Promise<Comment> {
    const result = await fetchWithAuth(`${API_URL}/api/ideas/${ideaId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content, parent_comment_id: parentId ?? null }),
    })
    return result.data.comment
  }

  static async updateComment(commentId: string, content: string): Promise<Comment> {
    const result = await fetchWithAuth(`${API_URL}/api/comments/${commentId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    })
    return result.data.comment
  }

  static async deleteComment(commentId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/comments/${commentId}`, { method: 'DELETE' })
  }
}
