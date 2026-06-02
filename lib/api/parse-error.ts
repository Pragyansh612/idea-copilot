/** Parse FastAPI / app error JSON into a user-visible string. */
export function parseApiError(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return 'Request failed'
  const body = payload as {
    message?: string
    detail?: string | Array<{ msg?: string; loc?: unknown[] }>
  }
  if (body.message) return body.message
  if (typeof body.detail === 'string') return body.detail
  if (Array.isArray(body.detail) && body.detail.length > 0) {
    const first = body.detail[0]
    if (first?.msg) {
      const field = Array.isArray(first.loc)
        ? first.loc.filter(x => typeof x === 'string' && x !== 'body').join(' ')
        : ''
      return field ? `${field}: ${first.msg}` : first.msg
    }
  }
  return 'Request failed'
}
