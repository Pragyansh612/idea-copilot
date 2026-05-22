'use client'
import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AuthAPI } from '@/lib/api/auth'
import { clearSession } from '@/lib/auth/session'
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
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [err, setErr] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function checkExistingSession() {
      if (!TokenManager.isAuthenticated()) {
        if (!cancelled) setIsCheckingAuth(false)
        return
      }
      try {
        await AuthAPI.getMe()
        if (!cancelled) router.replace(routes.dashboard)
      } catch {
        await clearSession()
        if (!cancelled) setIsCheckingAuth(false)
      }
    }
    checkExistingSession()
    return () => { cancelled = true }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setIsLoading(true)

    try {
      const response = await AuthAPI.signup({
        email,
        password: pass,
        display_name: name.trim() || undefined,
      })
      const access_token = response?.data?.session?.access_token
      const refresh_token = response?.data?.session?.refresh_token

      if (!access_token || !refresh_token) {
        router.push(`${routes.login}?message=${encodeURIComponent('Account created. Check your email to confirm, then sign in.')}`)
        return
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
      window.location.href = routes.dashboard
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Signup failed. Please try again.')
    } finally {
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
        <p style={{ fontSize: 14, color: 'var(--fg-2)', marginBottom: 28 }}>Create a free workspace account.</p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <label style={labelStyle}>Name</label>
          <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Your name" disabled={isLoading} />
          <label style={labelStyle}>Email</label>
          <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} required disabled={isLoading} />
          <label style={labelStyle}>Password</label>
          <input type="password" style={inputStyle} value={pass} onChange={e => setPass(e.target.value)} required minLength={6} disabled={isLoading} />
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
