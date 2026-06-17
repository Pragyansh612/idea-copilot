/** Persist auth tokens in Next.js cookies so middleware can protect /dashboard routes. */
export async function syncAuthCookies(accessToken: string, refreshToken: string): Promise<void> {
  const response = await fetch('/api/auth/set-cookies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ access_token: accessToken, refresh_token: refreshToken }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(
      (errorData as { error?: string }).error || 'Failed to set authentication cookies',
    )
  }
}
