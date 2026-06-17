export type LaunchChecklistItem = {
  id: string
  label: string
}

export const LAUNCH_CHECKLIST_ITEMS: LaunchChecklistItem[] = [
  { id: 'mvp-scoped', label: 'MVP scoped' },
  { id: 'competitors-known', label: 'Competitors known' },
  { id: 'market-gap', label: 'Market gap identified' },
  { id: 'acquisition-channel', label: 'First user acquisition channel decided' },
  { id: 'feedback-loop', label: 'Feedback loop planned' },
]

const STORAGE_PREFIX = 'ic-launch-checklist:'

export function loadLaunchChecklist(ideaId: string): Record<string, boolean> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${ideaId}`)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as Record<string, boolean>
    return typeof parsed === 'object' && parsed !== null ? parsed : {}
  } catch {
    return {}
  }
}

export function saveLaunchChecklist(ideaId: string, checked: Record<string, boolean>): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(`${STORAGE_PREFIX}${ideaId}`, JSON.stringify(checked))
}

export function toggleLaunchChecklistItem(
  ideaId: string,
  itemId: string,
  current: Record<string, boolean>,
): Record<string, boolean> {
  const next = { ...current, [itemId]: !current[itemId] }
  saveLaunchChecklist(ideaId, next)
  return next
}

export function launchChecklistProgress(checked: Record<string, boolean>): {
  done: number
  total: number
} {
  const total = LAUNCH_CHECKLIST_ITEMS.length
  const done = LAUNCH_CHECKLIST_ITEMS.filter(item => checked[item.id]).length
  return { done, total }
}
