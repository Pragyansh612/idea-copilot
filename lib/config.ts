/** Public API base URL (must be set in production). */
export function getApiUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
}

export const isProduction = process.env.NODE_ENV === 'production'
