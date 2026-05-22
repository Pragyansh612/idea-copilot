'use client'

import type { ReactNode } from 'react'
import * as DI from '@/components/dashboard/Icons'

export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="page-state page-state--loading">
      <div className="page-state-spinner" aria-hidden />
      <p>{label}</p>
    </div>
  )
}

export function PageError({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="page-state page-state--error dash-card">
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-sm solid" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  )
}

export function PageEmpty({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="page-state page-state--empty dash-card">
      {icon && <div className="page-state-icon">{icon}</div>}
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  )
}
