'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { statusBadge, timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

export default function ExportsPage() {
  const router = useRouter()
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await IdeaAPI.getIdeas({
        limit: 30,
        sort_by: 'updated_at',
        sort_order: 'desc',
      })
      setIdeas(result.ideas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load ideas')
      setIdeas([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Exports</div>
          <h1>Export from <em>each idea</em>.</h1>
          <div className="ph-sub">
            Exports are available inside every idea workspace — pitch decks, memos, and bundles open from the idea detail page.
          </div>
        </div>
      </div>

      <div className="dash-card exports-intro">
        <DI.Export />
        <p>
          Open an idea and use <strong>Export</strong> in the header to generate PDF, Markdown, or other formats via Copilot and the export API.
        </p>
      </div>

      {loading && <PageLoading label="Loading your ideas…" />}
      {!loading && error && <PageError message={error} onRetry={load} />}
      {!loading && !error && ideas.length === 0 && (
        <PageEmpty
          icon={<DI.Folder />}
          title="No ideas to export"
          description="Create an idea first, then export from its detail page."
          action={
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> New idea
            </button>
          }
        />
      )}
      {!loading && !error && ideas.length > 0 && (
        <div className="exports-idea-list">
          <div className="section-block-head" style={{ marginBottom: 12 }}>
            <h2 style={{ fontWeight: 400, fontSize: 17, letterSpacing: '-0.02em' }}>Your ideas</h2>
          </div>
          {ideas.map(idea => {
            const badge = statusBadge(idea.status)
            return (
              <div key={idea.id} className="exports-idea-row dash-card">
                <div>
                  <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                  <h3 style={{ margin: '8px 0 4px', fontSize: 16, fontWeight: 500 }}>{idea.title}</h3>
                  <p style={{ fontSize: 13, color: 'var(--fg-2)', margin: 0 }}>{timeAgo(idea.updated_at)}</p>
                </div>
                <button
                  type="button"
                  className="btn-sm solid"
                  onClick={() => router.push(routes.ideaExport(idea.id))}
                >
                  <DI.Export /> Export
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
