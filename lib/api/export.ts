import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export type ExportFormat = 'markdown' | 'pdf' | 'json' | 'csv'

export class ExportAPI {
  static async exportMarkdown(ideaId: string): Promise<{ markdown: string; size?: number }> {
    const result = await fetchWithAuth(`${API_URL}/api/export/markdown`, {
      method: 'POST',
      body: JSON.stringify({
        export_type: 'specific_ideas',
        export_format: 'markdown',
        ideas_exported: [ideaId],
      }),
    })
    return {
      markdown: result.data.markdown as string,
      size: result.data.size as number | undefined,
    }
  }

  static async exportPdf(ideaId: string): Promise<{ pdfBase64: string; sizeBytes?: number }> {
    const result = await fetchWithAuth(`${API_URL}/api/export/pdf`, {
      method: 'POST',
      body: JSON.stringify({
        export_type: 'specific_ideas',
        export_format: 'pdf',
        ideas_exported: [ideaId],
      }),
    })
    return {
      pdfBase64: result.data.pdf_base64 as string,
      sizeBytes: result.data.size_bytes as number | undefined,
    }
  }
}
