import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { isValidAccessToken, isValidRefreshToken } from '@/lib/auth/validate-token'

function isSameOriginRequest(request: Request): boolean {
  const host = request.headers.get('host')
  if (!host) return false

  const origin = request.headers.get('origin')
  if (origin) {
    try {
      return new URL(origin).host === host
    } catch {
      return false
    }
  }

  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).host === host
    } catch {
      return false
    }
  }

  // Non-browser clients cannot set dashboard cookies without Origin/Referer.
  return process.env.NODE_ENV !== 'production'
}

export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const access_token =
      typeof body?.access_token === 'string' ? body.access_token.trim() : ''
    const refresh_token =
      typeof body?.refresh_token === 'string' ? body.refresh_token.trim() : ''

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: 'Missing tokens' }, { status: 400 })
    }

    if (!isValidAccessToken(access_token)) {
      return NextResponse.json(
        { error: 'Invalid or expired access token' },
        { status: 400 },
      )
    }

    if (!isValidRefreshToken(refresh_token)) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === 'production'

    // Readable by middleware + TokenManager cookie fallback (httpOnly caused auth redirect loops).
    cookieStore.set('access_token', access_token, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    cookieStore.set('refresh_token', refresh_token, {
      httpOnly: false,
      secure: isProd,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error setting cookies:', error)
    return NextResponse.json({ error: 'Failed to set cookies' }, { status: 500 })
  }
}
