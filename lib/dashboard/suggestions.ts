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

function normTitle(s: string): string {
  return s.trim().toLowerCase()
}

function itemTitle(row: Record<string, unknown>): string {
  return String(row.title || row.name || row.feature || row.phase || 'Suggestion').trim()
}

/** Description/rationale only — keep user_benefit separate to avoid duplicate UI. */
function itemBody(row: Record<string, unknown>): string {
  const parts = [
    typeof row.description === 'string' ? row.description.trim() : '',
    typeof row.rationale === 'string' ? row.rationale.trim() : '',
  ].filter(Boolean)
  return parts.join('\n\n') || ''
}

function appliedTitlesFromContent(parsed: unknown): Set<string> {
  const obj = asRecord(parsed)
  if (!obj || !Array.isArray(obj.applied_titles)) return new Set()
  return new Set(
    obj.applied_titles
      .map(t => (typeof t === 'string' ? normTitle(t) : ''))
      .filter(Boolean),
  )
}

function nestedItems(parsed: unknown): unknown[] | null {
  if (Array.isArray(parsed) && parsed.length > 0) return parsed
  const obj = asRecord(parsed)
  if (!obj) return null
  if (Array.isArray(obj._suggestion_items) && obj._suggestion_items.length > 0) {
    return obj._suggestion_items
  }
  const nested =
    (Array.isArray(obj.possible_features) && obj.possible_features) ||
    (Array.isArray(obj.features) && obj.features) ||
    (Array.isArray(obj.items) && obj.items) ||
    (Array.isArray(obj.phases) && obj.phases) ||
    null
  return nested && nested.length > 0 ? nested : null
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
      const title = itemTitle(row)
      const body = itemBody(row)
      return {
        key: `${s.id}:${idx}`,
        suggestionId: s.id,
        suggestionType: s.suggestion_type || itemType,
        title,
        body: body || title,
        priority: typeof row.priority === 'string' ? row.priority : undefined,
        estimatedEffort: row.estimated_effort as number | string | undefined,
        userBenefit: typeof row.user_benefit === 'string' ? row.user_benefit : undefined,
        itemType,
      } satisfies SuggestionCard
    })
    .filter((x): x is SuggestionCard => Boolean(x))
}

export type ExpandSuggestionsOptions = {
  /** Titles already on the idea (features/phases) — hide matching cards. */
  existingTitles?: Iterable<string>
  /** Extra client-side dismissals (optimistic). */
  dismissedKeys?: Iterable<string>
}

/** Flatten each stored AI suggestion into readable cards (handles JSON array blobs). */
export function expandSuggestions(
  list: AISuggestion[],
  opts: ExpandSuggestionsOptions = {},
): SuggestionCard[] {
  const existing = new Set(
    [...(opts.existingTitles ?? [])].map(normTitle).filter(Boolean),
  )
  const dismissed = new Set([...(opts.dismissedKeys ?? [])])
  const out: SuggestionCard[] = []

  for (const s of list) {
    if (s.is_applied) continue

    const itemType = suggestionItemType(s)
    const parsed = parseMaybeJson(s.content)
    const appliedInContent = appliedTitlesFromContent(parsed)
    const nested = nestedItems(parsed)

    let cards: SuggestionCard[] = []

    if (nested) {
      cards = expandList(s, nested, itemType)
    } else {
      const obj = asRecord(parsed)
      if (obj && (typeof obj.title === 'string' || typeof obj.name === 'string')) {
        const title = itemTitle(obj)
        const body = itemBody(obj)
        cards = [
          {
            key: s.id,
            suggestionId: s.id,
            suggestionType: s.suggestion_type || itemType,
            title,
            body: body || (s.suggestion_text?.trim() ?? '') || title,
            priority: typeof obj.priority === 'string' ? obj.priority : undefined,
            estimatedEffort: obj.estimated_effort as number | string | undefined,
            userBenefit: typeof obj.user_benefit === 'string' ? obj.user_benefit : undefined,
            itemType,
          },
        ]
      } else {
        const text =
          (typeof s.suggestion_text === 'string' && s.suggestion_text.trim()) ||
          (typeof parsed === 'string' && parsed.trim()) ||
          (typeof s.content === 'string' && s.content.trim()) ||
          'No suggestion text'

        const looksJson = text.startsWith('[') || text.startsWith('{')
        cards = [
          {
            key: s.id,
            suggestionId: s.id,
            suggestionType: s.suggestion_type || itemType,
            title: looksJson ? `${itemType} suggestions` : text.slice(0, 72),
            body: looksJson ? "This suggestion didn't come back in a valid format. Generate again to retry." : text,
            itemType,
          },
        ]
      }
    }

    for (const card of cards) {
      if (dismissed.has(card.key)) continue
      const t = normTitle(card.title)
      if (t && (existing.has(t) || appliedInContent.has(t))) continue
      // Hide benefit line when body already equals benefit
      if (card.userBenefit && card.body.trim() === card.userBenefit.trim()) {
        out.push({ ...card, userBenefit: undefined })
      } else {
        out.push(card)
      }
    }
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
