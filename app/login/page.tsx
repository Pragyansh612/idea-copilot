'use client'
import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthAPI } from '@/lib/api/auth'
import { TokenManager } from '@/lib/auth/tokens'
import { routes } from '@/lib/routes'
import Link from 'next/link'

const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--bg)',
  position: 'relative',
  overflow: 'hidden',
}

const labelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10.5,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: 'var(--fg-3)',
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-2)',
  color: 'var(--fg)',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div style={shellStyle}><p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p></div>
    }>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect') || '/dashboard'

  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    if (TokenManager.isAuthenticated()) {
      router.push(routes.dashboard)
    } else {
      setIsCheckingAuth(false)
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setIsLoading(true)

    try {
      const response = await AuthAPI.login({ email, password: pass })
      const access_token = response?.data?.session?.access_token
      const refresh_token = response?.data?.session?.refresh_token

      if (!access_token || !refresh_token) {
        throw new Error('Unable to extract authentication tokens from server response')
      }

      TokenManager.setTokens(access_token, refresh_token)

      const cookieResponse = await fetch('/api/auth/set-cookies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ access_token, refresh_token }),
      })

      if (!cookieResponse.ok) {
        const errorData = await cookieResponse.json()
        throw new Error(errorData.error || 'Failed to set authentication cookies')
      }

      await new Promise(resolve => setTimeout(resolve, 150))
      window.location.href = redirectTo
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return (
      <div style={shellStyle}>
        <p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p>
      </div>
    )
  }

  return (
    <div style={shellStyle}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(60% 50% at 50% 0%, var(--accent-soft) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        backgroundImage: 'linear-gradient(to right, var(--line) 1px, transparent 1px), linear-gradient(to bottom, var(--line) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse 70% 50% at 50% 20%, #000 30%, transparent 80%)',
        WebkitMaskImage: 'radial-gradient(ellipse 70% 50% at 50% 20%, #000 30%, transparent 80%)',
      }} />

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: 400,
        margin: '0 20px',
        padding: 36,
        background: 'var(--surface)',
        border: '1px solid var(--line-2)',
        borderRadius: 20,
        boxShadow: 'var(--shadow-pop)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span className="mark" />
          <span style={{ fontSize: 16, fontWeight: 500, letterSpacing: '-0.015em' }}>IdeaCopilot</span>
        </div>

        <h2 style={{ fontWeight: 400, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--fg)' }}>
          Welcome back, <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>founder</em>.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', marginBottom: 28, lineHeight: 1.5 }}>
          Sign in with your MyIdeaCopilot account.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              disabled={isLoading}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={pass}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••••"
              required
              disabled={isLoading}
              style={inputStyle}
            />
          </div>

          {err && (
            <div style={{
              fontSize: 12.5, color: 'var(--warn)', fontFamily: 'var(--font-mono)',
              padding: '8px 12px', borderRadius: 8,
              background: 'color-mix(in srgb, var(--warn) 8%, transparent)',
              border: '1px solid color-mix(in srgb, var(--warn) 24%, transparent)',
            }}>
              {err}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            style={{
              marginTop: 4,
              padding: '12px 20px',
              borderRadius: 10,
              background: 'var(--fg)',
              color: 'var(--bg)',
              fontWeight: 500,
              fontSize: 14.5,
              cursor: isLoading ? 'wait' : 'pointer',
              border: 0,
              opacity: isLoading ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in…' : 'Sign in to workspace →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
          API · {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--fg-2)' }}>
          No account? <Link href={routes.signup} style={{ color: 'var(--accent)' }}>Create one free</Link>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href={routes.home} style={{ fontSize: 13, color: 'var(--fg-2)' }}>← Back to landing page</Link>
        </div>
      </div>
    </div>
  )
}
