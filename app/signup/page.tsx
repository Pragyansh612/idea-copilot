'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AuthAPI } from '@/lib/api/auth'
import { clearSession, enterAuthenticatedApp } from '@/lib/auth/session'
import { safeRedirectPath } from '@/lib/auth/safe-redirect'
import { TokenManager } from '@/lib/auth/tokens'
import { routes } from '@/lib/routes'

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

export default function SignupPage() {
  return (
    <Suspense fallback={<div style={shellStyle}><p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p></div>}>
      <SignupForm />
    </Suspense>
  )
}

function SignupForm() {
  const searchParams = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const redirectTo = safeRedirectPath(redirectParam, routes.newIdea)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    let cancelled = false
    const timeout = window.setTimeout(() => {
      if (!cancelled) setIsCheckingAuth(false)
    }, 4000)

    async function checkExistingSession() {
      const token = TokenManager.getAccessToken()
      if (!token) {
        if (!cancelled) setIsCheckingAuth(false)
        return
      }
      try {
        await AuthAPI.getMe()
        if (cancelled) return
        await enterAuthenticatedApp(redirectTo)
      } catch {
        await clearSession()
        if (!cancelled) setIsCheckingAuth(false)
      }
    }
    void checkExistingSession()
    return () => {
      cancelled = true
      window.clearTimeout(timeout)
    }
  }, [redirectTo])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setIsLoading(true)

    try {
      const response = await AuthAPI.signup({
        email: email.trim().toLowerCase(),
        password: pass,
        display_name: name.trim() || undefined,
      })
      const access_token = response?.data?.session?.access_token
      const refresh_token = response?.data?.session?.refresh_token

      if (!access_token || !refresh_token) {
        window.location.href = `${routes.login}?message=${encodeURIComponent('Account created. Check your email to confirm, then sign in.')}`
        return
      }

      TokenManager.setTokens(access_token, refresh_token)
      const { syncAuthCookies } = await import('@/lib/auth/sync-cookies')
      await syncAuthCookies(access_token, refresh_token)
      window.location.assign(redirectTo)
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Signup failed. Please try again.')
      setIsLoading(false)
    }
  }

  if (isCheckingAuth) {
    return <div style={shellStyle}><p style={{ fontSize: 14, color: 'var(--fg-2)' }}>Loading…</p></div>
  }

  return (
    <div style={shellStyle}>
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(60% 50% at 50% 0%, var(--accent-soft) 0%, transparent 60%)',
      }} />
      <div style={{
        position: 'relative', width: '100%', maxWidth: 400, margin: '0 20px', padding: 36,
        background: 'var(--surface)', border: '1px solid var(--line-2)', borderRadius: 20, boxShadow: 'var(--shadow-pop)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
          <span className="mark" />
          <span style={{ fontSize: 16, fontWeight: 500 }}>IdeaCopilot</span>
        </div>

        <h2 style={{ fontWeight: 400, fontSize: 28, letterSpacing: '-0.03em', marginBottom: 6 }}>
          Start your <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', color: 'var(--accent)' }}>lab</em>.
        </h2>
        <p style={{ fontSize: 14, color: 'var(--fg-2)', marginBottom: 8, lineHeight: 1.5 }}>
          Create a free workspace account.
        </p>
        <p style={{ fontSize: 13, color: 'var(--fg-3)', marginBottom: 28, lineHeight: 1.5 }}>
          After signup you&apos;ll capture your first idea and get a guided checklist.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" disabled={isLoading} />
          <label style={labelStyle}>Email</label>
          <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
          <label style={labelStyle}>Password</label>
          <input type="password" style={inputStyle} value={pass} onChange={e => setPass(e.target.value)} required minLength={6} autoComplete="new-password" disabled={isLoading} />
          <p style={{ fontSize: 12, color: 'var(--fg-3)', margin: '-6px 0 0' }}>At least 6 characters.</p>
          {err && <div style={{ fontSize: 12.5, color: 'var(--warn)', fontFamily: 'var(--font-mono)' }}>{err}</div>}
          <button type="submit" disabled={isLoading} style={{ marginTop: 4, padding: '12px 20px', borderRadius: 10, background: 'var(--fg)', color: 'var(--bg)', fontWeight: 500, border: 0, cursor: isLoading ? 'wait' : 'pointer' }}>
            {isLoading ? 'Creating account…' : 'Create workspace →'}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: 'var(--fg-2)' }}>
          Already have an account? <Link href={routes.login} style={{ color: 'var(--accent)' }}>Sign in</Link>
        </div>
        <div style={{ marginTop: 12, textAlign: 'center' }}>
          <Link href={routes.home} style={{ fontSize: 13, color: 'var(--fg-2)' }}>← Back to landing page</Link>
        </div>
      </div>
    </div>
  )
}
