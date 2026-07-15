import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

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

  return process.env.NODE_ENV !== 'production'
}

function asToken(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (value == null) return ''
  return String(value).trim()
}

/**
 * Persist tokens from a successful backend signup/login.
 * These tokens were already accepted by Supabase — only sanity-check shape
 * so we don't recreate brittle JWT parsing races here.
 */
export async function POST(request: Request) {
  try {
    if (!isSameOriginRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json().catch(() => ({}))
    const access_token = asToken(body?.access_token)
    const refresh_token = asToken(body?.refresh_token)

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        {
          error: 'Missing tokens',
          detail: {
            access_type: typeof body?.access_token,
            refresh_type: typeof body?.refresh_token,
            access_len: access_token.length,
            refresh_len: refresh_token.length,
          },
        },
        { status: 400 },
      )
    }

    // Access tokens are JWTs (3 segments). Refresh may be opaque.
    const accessParts = access_token.split('.')
    if (accessParts.length !== 3 || access_token.length < 20) {
      console.error('set-cookies: bad access token shape', {
        parts: accessParts.length,
        length: access_token.length,
      })
      return NextResponse.json(
        { error: 'Invalid access token shape' },
        { status: 400 },
      )
    }

    if (refresh_token.length < 8) {
      return NextResponse.json({ error: 'Invalid refresh token' }, { status: 400 })
    }

    const cookieStore = await cookies()
    const isProd = process.env.NODE_ENV === 'production'

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
