import type { AISuggestion } from '@/lib/api/idea'

export function suggestionBody(s: AISuggestion): string {
  if (s.suggestion_text?.trim()) return s.suggestion_text.trim()
  const c = s.content
  if (typeof c === 'string' && c.trim()) return c.trim()
  if (c && typeof c === 'object') {
    const o = c as Record<string, unknown>
    if (typeof o.description === 'string') return o.description
    if (typeof o.title === 'string') return o.title
    if (Array.isArray(o.items)) {
      return o.items
        .map(item => {
          if (typeof item === 'string') return item
          if (item && typeof item === 'object') {
            const row = item as Record<string, unknown>
            return String(row.title || row.name || row.description || '')
          }
          return ''
        })
        .filter(Boolean)
        .join('\n')
    }
    try {
      return JSON.stringify(c, null, 2)
    } catch {
      return String(c)
    }
  }
  return 'No suggestion text'
}

export function suggestionItemType(s: AISuggestion): 'feature' | 'phase' {
  const t = `${s.suggestion_type || ''}`.toLowerCase()
  return t.includes('phase') ? 'phase' : 'feature'
}
