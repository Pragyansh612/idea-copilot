'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiTokenAPI, type ApiToken } from '@/lib/api/api-tokens'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { Toast } from '@/components/dashboard/Toast'
import { formatDate } from '@/lib/dashboard/format'
import * as DI from '@/components/dashboard/Icons'

export default function SettingsApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [createdSecret, setCreatedSecret] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const list = await ApiTokenAPI.listTokens()
      setTokens(list)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load API tokens')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function createToken() {
    if (!newName.trim()) return
    try {
      setCreating(true)
      setError(null)
      const { token, secret } = await ApiTokenAPI.createToken(newName.trim())
      setTokens(prev => [token, ...prev])
      setCreatedSecret(secret)
      setNewName('')
      setToast('Token created. Copy the secret now — it will not be shown again.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create token')
    } finally {
      setCreating(false)
    }
  }

  if (loading) return <PageLoading label="Loading API tokens…" />
  if (error) return <PageError message={error} onRetry={load} />

  return (
    <div>
      {toast && <Toast message={toast} onDismiss={() => setToast(null)} />}
      <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 16px' }}>
        Personal API tokens for programmatic access to your workspace.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <input
          style={{ flex: 1, minWidth: 200, padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
          placeholder="Token name (e.g. CI automation)"
          value={newName}
          onChange={e => setNewName(e.target.value)}
        />
        <button type="button" className="btn-sm solid" onClick={() => void createToken()} disabled={creating || !newName.trim()}>
          <DI.Plus /> {creating ? 'Creating…' : 'Create token'}
        </button>
      </div>
      {createdSecret && (
        <div className="dash-card" style={{ padding: 12, marginBottom: 16, borderColor: 'var(--accent-line)' }}>
          <div className="eyebrow-mono" style={{ marginBottom: 6 }}>New token secret</div>
          <code style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--fg)' }}>{createdSecret}</code>
          <button
            type="button"
            className="btn-sm ghost"
            style={{ marginTop: 8 }}
            onClick={() => {
              void navigator.clipboard.writeText(createdSecret)
              setToast('Copied to clipboard.')
            }}
          >
            Copy secret
          </button>
        </div>
      )}
      {tokens.length === 0 ? (
        <p style={{ fontSize: 13, color: 'var(--fg-3)' }}>No API tokens yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {tokens.map(t => (
            <div
              key={t.id}
              className="dash-card"
              style={{ padding: '12px 14px', display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
            >
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 4 }}>
                  {(t.scopes || []).join(', ') || 'default scopes'}
                </div>
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>
                Created {formatDate(t.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
