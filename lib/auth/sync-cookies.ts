/** Persist auth tokens in Next.js cookies so middleware can protect /dashboard routes. */
export async function syncAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  if (!accessToken?.trim() || !refreshToken?.trim()) {
    throw new Error('Missing authentication tokens')
  }

  const response = await fetch('/api/auth/set-cookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      access_token: accessToken.trim(),
      refresh_token: refreshToken.trim(),
    }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({})) as {
      error?: string
      detail?: unknown
    }
    console.error('set-cookies failed', response.status, errorData)
    throw new Error(errorData.error || 'Failed to set authentication cookies')
  }
}
