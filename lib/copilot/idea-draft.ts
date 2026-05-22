import type { PriorityEnum } from '@/lib/api/idea'

export type IdeaDraftField = 'title' | 'description' | 'priority' | 'tags'

export type IdeaDraft = {
  title: string
  description: string
  priority: PriorityEnum
  tags: string[]
  included: Record<IdeaDraftField, boolean>
  source?: 'new-idea' | 'copilot'
}

const STORAGE_KEY = 'ic-idea-draft'

export const EMPTY_IDEA_DRAFT: IdeaDraft = {
  title: '',
  description: '',
  priority: 'medium',
  tags: [],
  included: {
    title: true,
    description: true,
    priority: true,
    tags: true,
  },
  source: 'new-idea',
}

export function saveIdeaDraft(draft: IdeaDraft): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(draft))
  } catch {
    // ignore quota errors
  }
}

export function loadIdeaDraft(): IdeaDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as IdeaDraft
    return { ...EMPTY_IDEA_DRAFT, ...parsed, included: { ...EMPTY_IDEA_DRAFT.included, ...parsed.included } }
  } catch {
    return null
  }
}

export function clearIdeaDraft(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(STORAGE_KEY)
}

export function draftFromForm(input: {
  title: string
  description: string
  priority: PriorityEnum
  tags: string
}): IdeaDraft {
  return {
    title: input.title.trim(),
    description: input.description.trim(),
    priority: input.priority,
    tags: input.tags.split(',').map(t => t.trim()).filter(Boolean),
    included: {
      title: true,
      description: true,
      priority: true,
      tags: true,
    },
    source: 'new-idea',
  }
}

export function buildDraftContextMessage(draft: IdeaDraft, userPrompt: string): string {
  const lines: string[] = []
  if (draft.included.title && draft.title) lines.push(`Title: ${draft.title}`)
  if (draft.included.description && draft.description) lines.push(`Description: ${draft.description}`)
  if (draft.included.priority) lines.push(`Priority: ${draft.priority}`)
  if (draft.included.tags && draft.tags.length) lines.push(`Tags: ${draft.tags.join(', ')}`)

  if (lines.length === 0) return userPrompt

  return `Idea draft context (user may refine before saving):\n${lines.join('\n')}\n\nUser message:\n${userPrompt}`
}

export function hasDraftContent(draft: IdeaDraft): boolean {
  return Boolean(
    (draft.included.title && draft.title) ||
    (draft.included.description && draft.description) ||
    (draft.included.tags && draft.tags.length) ||
    draft.included.priority,
  )
}
