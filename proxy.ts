import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAccessTokenExpired } from '@/lib/auth/jwt'
import { isJwtShape } from '@/lib/auth/validate-token'

/**
 * Protects /dashboard/* only. Public marketing + /product/* stay open.
 * Requires a non-expired access_token cookie (set via /api/auth/set-cookies).
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname
  if (!path.startsWith('/dashboard')) {
    return NextResponse.next()
  }

  const token = request.cookies.get('access_token')?.value?.trim() || ''
  const valid = Boolean(token) && isJwtShape(token) && !isAccessTokenExpired(token)

  if (!valid) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    if (token) {
      loginUrl.searchParams.set('message', 'session_expired')
    }
    const response = NextResponse.redirect(loginUrl)
    response.cookies.delete('access_token')
    response.cookies.delete('refresh_token')
    return response
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
