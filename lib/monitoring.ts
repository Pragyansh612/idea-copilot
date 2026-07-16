import * as Sentry from '@sentry/nextjs'

export function captureError(
  error: unknown,
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Error]', error, context)
    return
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }
    Sentry.captureException(error)
  })
}

export function captureMessage(
  message: string,
  level: 'info' | 'warning' | 'error' = 'info',
  context?: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[${level}]`, message, context)
    return
  }

  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value)
      })
    }
    Sentry.captureMessage(message, level)
  })
}
