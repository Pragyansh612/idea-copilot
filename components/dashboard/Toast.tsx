'use client'

import { useEffect } from 'react'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  message: string
  variant?: 'success' | 'error'
  onDismiss: () => void
  durationMs?: number
}

export function Toast({ message, variant = 'success', onDismiss, durationMs = 4000 }: Props) {
  useEffect(() => {
    const t = window.setTimeout(onDismiss, durationMs)
    return () => window.clearTimeout(t)
  }, [message, durationMs, onDismiss])

  return (
    <div
      className={`dash-toast dash-toast-${variant}`}
      role="status"
      aria-live="polite"
    >
      <span className="dash-toast-icon">
        {variant === 'success' ? <DI.Check /> : <DI.X />}
      </span>
      <span>{message}</span>
      <button type="button" className="dash-toast-close" onClick={onDismiss} aria-label="Dismiss">
        <DI.X />
      </button>
    </div>
  )
}
