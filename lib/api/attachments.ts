import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type Attachment = {
  id: string
  idea_id: string
  file_name: string
  file_type?: string
  file_size?: number
  signed_url?: string
  created_at: string
}

export class AttachmentAPI {
  static async listForIdea(ideaId: string): Promise<Attachment[]> {
    const result = await fetchWithAuth(`${API_URL}/api/attachments/${ideaId}`)
    return (result.data.attachments || []) as Attachment[]
  }

  static async upload(ideaId: string, file: File): Promise<Attachment> {
    const form = new FormData()
    form.append('file', file)
    form.append('idea_id', ideaId)
    const result = await fetchWithAuth(`${API_URL}/api/attachments/upload`, {
      method: 'POST',
      body: form,
    })
    return result.data.attachment as Attachment
  }

  static async remove(attachmentId: string): Promise<void> {
    await fetchWithAuth(`${API_URL}/api/attachments/${attachmentId}`, {
      method: 'DELETE',
    })
  }
}
