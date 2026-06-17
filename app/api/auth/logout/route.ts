import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = await cookies()

    cookieStore.set('access_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    cookieStore.set('refresh_token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error clearing cookies:', error)
    return NextResponse.json({ error: 'Failed to clear cookies' }, { status: 500 })
  }
}
