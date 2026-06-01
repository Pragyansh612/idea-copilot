'use client'

import type { ReadinessItem } from '@/lib/dashboard/readiness'
import * as DI from '@/components/dashboard/Icons'

export function ReadinessChecklist({ items }: { items: ReadinessItem[] }) {
  return (
    <div className="readiness-checklist">
      {items.map(item => (
        <div key={item.key} className={`readiness-checklist-row ${item.done ? 'done' : ''}`}>
          <span className="readiness-check-icon" aria-hidden>
            {item.done ? <DI.Check /> : <span className="readiness-check-empty" />}
          </span>
          <span className="readiness-check-label">{item.label}</span>
          {!item.done && (
            <button type="button" className="btn-sm ghost readiness-check-cta" onClick={item.action}>
              {item.cta}
            </button>
          )}
        </div>
      ))}
    </div>
  )
}
