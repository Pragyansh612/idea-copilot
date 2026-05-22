import type { Phase } from '@/lib/api/idea'

export function phaseProgress(phases: Phase[]): {
  total: number
  completed: number
  percent: number
} {
  const total = phases.length
  if (total === 0) return { total: 0, completed: 0, percent: 0 }
  const completed = phases.filter(p => p.is_completed).length
  return {
    total,
    completed,
    percent: Math.round((completed / total) * 100),
  }
}
