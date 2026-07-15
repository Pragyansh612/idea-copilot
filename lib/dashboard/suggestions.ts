import type { AISuggestion } from '@/lib/api/idea'

export type SuggestionCard = {
  key: string
  suggestionId: string
  suggestionType: string
  title: string
  body: string
  priority?: string
  estimatedEffort?: number | string
  userBenefit?: string
  itemType: 'feature' | 'phase'
}

function asRecord(v: unknown): Record<string, unknown> | null {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : null
}

function parseMaybeJson(raw: unknown): unknown {
  if (typeof raw !== 'string') return raw
  const t = raw.trim()
  if (!t) return raw
  if (!(t.startsWith('[') || t.startsWith('{'))) return raw
  try {
    return JSON.parse(t) as unknown
  } catch {
    return raw
  }
}

function itemTitle(row: Record<string, unknown>): string {
  return String(row.title || row.name || row.feature || row.phase || 'Suggestion').trim()
}

function itemBody(row: Record<string, unknown>): string {
  const parts = [
    typeof row.description === 'string' ? row.description.trim() : '',
    typeof row.user_benefit === 'string' ? row.user_benefit.trim() : '',
    typeof row.rationale === 'string' ? row.rationale.trim() : '',
  ].filter(Boolean)
  return parts.join('\n\n') || itemTitle(row)
}

function expandList(
  s: AISuggestion,
  list: unknown[],
  itemType: 'feature' | 'phase',
): SuggestionCard[] {
  return list
    .map((item, idx) => {
      if (typeof item === 'string' && item.trim()) {
        return {
          key: `${s.id}:${idx}`,
          suggestionId: s.id,
          suggestionType: s.suggestion_type || itemType,
          title: item.trim().slice(0, 80),
          body: item.trim(),
          itemType,
        } satisfies SuggestionCard
      }
      const row = asRecord(item)
      if (!row) return null
      return {
        key: `${s.id}:${idx}`,
        suggestionId: s.id,
        suggestionType: s.suggestion_type || itemType,
        title: itemTitle(row),
        body: itemBody(row),
        priority: typeof row.priority === 'string' ? row.priority : undefined,
        estimatedEffort: row.estimated_effort as number | string | undefined,
        userBenefit: typeof row.user_benefit === 'string' ? row.user_benefit : undefined,
        itemType,
      } satisfies SuggestionCard
    })
    .filter((x): x is SuggestionCard => Boolean(x))
}

/** Flatten each stored AI suggestion into readable cards (handles JSON array blobs). */
export function expandSuggestions(list: AISuggestion[]): SuggestionCard[] {
  const out: SuggestionCard[] = []
  for (const s of list) {
    const itemType = suggestionItemType(s)
    const parsed = parseMaybeJson(s.content)

    if (Array.isArray(parsed) && parsed.length > 0) {
      out.push(...expandList(s, parsed, itemType))
      continue
    }

    const obj = asRecord(parsed)
    if (obj) {
      const nested =
        (Array.isArray(obj.possible_features) && obj.possible_features) ||
        (Array.isArray(obj.features) && obj.features) ||
        (Array.isArray(obj.items) && obj.items) ||
        (Array.isArray(obj.phases) && obj.phases) ||
        null
      if (nested && nested.length > 0) {
        out.push(...expandList(s, nested, itemType))
        continue
      }
      if (typeof obj.title === 'string' || typeof obj.name === 'string') {
        out.push({
          key: s.id,
          suggestionId: s.id,
          suggestionType: s.suggestion_type || itemType,
          title: itemTitle(obj),
          body: itemBody(obj) || (s.suggestion_text?.trim() ?? ''),
          priority: typeof obj.priority === 'string' ? obj.priority : undefined,
          estimatedEffort: obj.estimated_effort as number | string | undefined,
          userBenefit: typeof obj.user_benefit === 'string' ? obj.user_benefit : undefined,
          itemType,
        })
        continue
      }
    }

    const text =
      (typeof s.suggestion_text === 'string' && s.suggestion_text.trim()) ||
      (typeof parsed === 'string' && parsed.trim()) ||
      (typeof s.content === 'string' && s.content.trim()) ||
      'No suggestion text'

    // Avoid dumping raw JSON as the only view when parse failed partially
    const looksJson = text.startsWith('[') || text.startsWith('{')
    out.push({
      key: s.id,
      suggestionId: s.id,
      suggestionType: s.suggestion_type || itemType,
      title: looksJson ? `${itemType} suggestions` : text.slice(0, 72),
      body: looksJson ? 'Open the raw payload failed to parse. Try generating again.' : text,
      itemType,
    })
  }
  return out
}

export function suggestionBody(s: AISuggestion): string {
  const cards = expandSuggestions([s])
  if (cards.length === 1) return cards[0].body || cards[0].title
  return cards.map(c => `• ${c.title}`).join('\n')
}

export function suggestionItemType(s: AISuggestion): 'feature' | 'phase' {
  const t = `${s.suggestion_type || ''}`.toLowerCase()
  return t.includes('phase') ? 'phase' : 'feature'
}
