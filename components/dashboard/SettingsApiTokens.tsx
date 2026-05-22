'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiTokenAPI, type ApiToken } from '@/lib/api/api-tokens'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { formatDate } from '@/lib/dashboard/format'

export default function SettingsApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  if (loading) return <PageLoading label="Loading API tokens…" />
  if (error) return <PageError message={error} onRetry={load} />

  return (
    <div>
      <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.55, margin: '0 0 16px' }}>
        Personal API tokens for programmatic access. Create tokens in the API docs or via POST /api/tokens when you need automation.
      </p>
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
