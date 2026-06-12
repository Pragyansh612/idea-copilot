import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAccessTokenExpired } from '@/lib/auth/jwt'

/**
 * Protects /dashboard/* only. Public marketing + /product/* stay open.
 * Rejects missing or expired JWT cookies to avoid glitchy half-authenticated states.
 */
export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname
  const isDashboardPath = path.startsWith('/dashboard')
  const token = request.cookies.get('access_token')?.value?.trim() || ''

  if (isDashboardPath && (!token || isAccessTokenExpired(token))) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', path)
    if (token && isAccessTokenExpired(token)) {
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
