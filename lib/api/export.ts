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

  /**
   * Notion/Trello credentials are sent per-request only — the backend
   * accepts them as request-body overrides (see NotionExportRequest /
   * TrelloExportRequest) and doesn't require them to be stored anywhere.
   * Nothing here persists them client-side either.
   */
  static async exportNotion(ideaId: string, apiKey: string, parentPageId: string): Promise<{ pagesCreated: number }> {
    const result = await fetchWithAuth(`${API_URL}/api/export/notion`, {
      method: 'POST',
      body: JSON.stringify({
        export_type: 'specific_ideas',
        ideas_exported: [ideaId],
        notion_api_key: apiKey,
        notion_parent_page_id: parentPageId,
      }),
    })
    return { pagesCreated: (result.data.pages_created as number) ?? 0 }
  }

  static async exportTrello(
    ideaId: string,
    apiKey: string,
    token: string,
    boardName: string,
  ): Promise<{ cardsCreated: number }> {
    const result = await fetchWithAuth(`${API_URL}/api/export/trello`, {
      method: 'POST',
      body: JSON.stringify({
        export_type: 'specific_ideas',
        ideas_exported: [ideaId],
        trello_api_key: apiKey,
        trello_token: token,
        board_name: boardName || 'MyIdeaCopilot Export',
      }),
    })
    return { cardsCreated: (result.data.cards_created as number) ?? 0 }
  }
}
