'use client'
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ShareAPI, type Share, type ShareRole } from '@/lib/api/share'
import { timeAgo } from '@/lib/dashboard/format'
import * as DI from '@/components/dashboard/Icons'

interface Props {
  ideaId: string
  ideaTitle: string
  onClose: () => void
}

export function ShareModal({ ideaId, ideaTitle, onClose }: Props) {
  const [shares, setShares] = useState<Share[]>([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ShareRole>('viewer')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    emailRef.current?.focus()
    load()
  }, [])

  async function load() {
    try {
      setLoading(true)
      setLoadError(null)
      const result = await ShareAPI.getShares(ideaId)
      setShares(result.filter(s => s.is_active))
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load collaborators')
    } finally {
      setLoading(false)
    }
  }

  async function invite() {
    const emailTrimmed = email.trim().toLowerCase()
    if (!emailTrimmed) return
    try {
      setSending(true)
      setError(null)
      const share = await ShareAPI.createShare(ideaId, emailTrimmed, role)
      setShares(prev => [...prev, share])
      setEmail('')
      setSuccess(`Invited ${emailTrimmed}`)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  async function revoke(shareId: string) {
    if (!confirm('Revoke access for this collaborator?')) return
    try {
      await ShareAPI.revokeShare(ideaId, shareId)
      setShares(prev => prev.filter(s => s.id !== shareId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke share')
    }
  }

  async function changeRole(share: Share, newRole: ShareRole) {
    try {
      await ShareAPI.updateShare(ideaId, share.id, { role: newRole })
      setShares(prev => prev.map(s => s.id === share.id ? { ...s, role: newRole } : s))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const inp: React.CSSProperties = {
    padding: '9px 12px',
    borderRadius: 8,
    border: '1px solid var(--line-2)',
    background: 'var(--bg-2)',
    color: 'var(--fg)',
    font: 'inherit',
    fontSize: 14,
    outline: 'none',
  }

  const modal = (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box" style={{ maxWidth: 480, background: 'var(--surface)' }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow-mono" style={{ marginBottom: 4 }}>Share idea</div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>{ideaTitle}</h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}><DI.X /></button>
        </div>

        <div className="modal-body">
          {/* Invite form */}
          <div className="modal-section">
            <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Invite collaborator</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={emailRef}
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && void invite()}
                style={{ ...inp, flex: 1 }}
              />
              <select
                value={role}
                onChange={e => setRole(e.target.value as ShareRole)}
                style={{ ...inp, width: 100 }}
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
              </select>
              <button
                type="button"
                className="btn-sm solid"
                onClick={() => void invite()}
                disabled={sending || !email.trim()}
              >
                {sending ? '…' : 'Invite'}
              </button>
            </div>
            {error && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{error}</p>}
            {success && <p style={{ color: 'var(--good)', fontSize: 13, marginTop: 8 }}>{success}</p>}
          </div>

          {/* Existing shares */}
          <div className="modal-section" style={{ marginTop: 20 }}>
            <div className="eyebrow-mono" style={{ marginBottom: 10 }}>
              Collaborators {!loading && `· ${shares.length}`}
            </div>
            {loading ? (
              <p style={{ color: 'var(--fg-3)', fontSize: 13 }}>Loading…</p>
            ) : loadError ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <p style={{ color: 'var(--warn)', fontSize: 13, margin: 0 }}>
                  Couldn&apos;t load collaborators: {loadError}
                </p>
                <button type="button" className="btn-sm ghost" onClick={() => void load()}>
                  Retry
                </button>
              </div>
            ) : shares.length === 0 ? (
              <p style={{ color: 'var(--fg-3)', fontSize: 13 }}>
                Only you have access. Invite someone above.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {shares.map(s => (
                  <div key={s.id} className="share-row">
                    <div className="share-av">{(s.shared_with_email ?? '?')[0].toUpperCase()}</div>
                    <div className="share-info">
                      <div style={{ fontSize: 14 }}>{s.shared_with_email ?? 'Unknown'}</div>
                      <div style={{ fontSize: 12, color: 'var(--fg-3)' }}>Shared {timeAgo(s.shared_at)}</div>
                    </div>
                    <select
                      value={s.role}
                      onChange={e => void changeRole(s, e.target.value as ShareRole)}
                      style={{ ...inp, fontSize: 12, padding: '5px 8px', width: 90 }}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="editor">Editor</option>
                    </select>
                    <button type="button" className="btn-sm ghost" onClick={() => void revoke(s.id)} title="Revoke access">
                      <DI.Trash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Role legend */}
          <div style={{ marginTop: 16, padding: '12px 14px', borderRadius: 8, background: 'var(--bg-2)', border: '1px solid var(--line)', fontSize: 12, color: 'var(--fg-3)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--fg-2)' }}>Viewer</strong> — read-only access to this idea.&nbsp;&nbsp;
            <strong style={{ color: 'var(--fg-2)' }}>Editor</strong> — can add phases, features, and comments.
          </div>
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
