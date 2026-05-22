'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import { IdeaAPI, PhaseAPI, type Idea, type Phase } from '@/lib/api/idea'
import { phaseProgress } from '@/lib/dashboard/phase-progress'
import { statusBadge, statusLabel } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

type IdeaRoadmapRow = {
  idea: Idea
  phases: Phase[]
  progress: ReturnType<typeof phaseProgress>
}

export default function RoadmapsPage() {
  const router = useRouter()
  const [rows, setRows] = useState<IdeaRoadmapRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const { ideas } = await IdeaAPI.getIdeas({
        limit: 50,
        sort_by: 'updated_at',
        sort_order: 'desc',
      })
      const withPhases = await Promise.all(
        ideas.map(async idea => {
          try {
            const phases = await PhaseAPI.getPhases(idea.id)
            return { idea, phases, progress: phaseProgress(phases) }
          } catch {
            return { idea, phases: [], progress: phaseProgress([]) }
          }
        }),
      )
      setRows(withPhases)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load roadmaps')
      setRows([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Roadmaps · quick access</div>
          <h1>Phase progress <em>across ideas</em>.</h1>
          <div className="ph-sub">
            Jump into any idea&apos;s roadmap. Phases live on each idea — this is your progress overview.
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
            <DI.Plus /> New idea
          </button>
        </div>
      </div>

      {loading && <PageLoading label="Loading roadmap progress…" />}
      {!loading && error && <PageError message={error} onRetry={load} />}
      {!loading && !error && rows.length === 0 && (
        <PageEmpty
          icon={<DI.Route />}
          title="No ideas yet"
          description="Create an idea first, then add phases from its Roadmap tab."
          action={
            <button type="button" className="btn-sm solid" onClick={() => router.push(routes.newIdea)}>
              <DI.Plus /> Create idea
            </button>
          }
        />
      )}
      {!loading && !error && rows.length > 0 && (
        <div className="roadmap-list">
          {rows.map(({ idea, phases, progress }) => {
            const badge = statusBadge(idea.status)
            return (
              <div key={idea.id} className="roadmap-row dash-card">
                <div className="roadmap-row-main">
                  <div className="roadmap-row-head">
                    <span className={`i-tag ${badge.kind}`}>{badge.text}</span>
                    <span className="roadmap-row-status">{statusLabel(idea.status)}</span>
                  </div>
                  <h3 className="roadmap-row-title">{idea.title}</h3>
                  <p className="roadmap-row-meta">
                    {progress.total === 0
                      ? 'No phases yet'
                      : `${progress.completed} of ${progress.total} phases complete`}
                  </p>
                  <div className="roadmap-row-bar">
                    <div className="bar">
                      <div className="fill" style={{ width: `${progress.percent}%` }} />
                    </div>
                    <span className="roadmap-row-pct">{progress.percent}%</span>
                  </div>
                </div>
                <div className="roadmap-row-actions">
                  <button
                    type="button"
                    className="btn-sm solid"
                    onClick={() => router.push(routes.ideaTab(idea.id, 'phases'))}
                  >
                    Open roadmap
                  </button>
                  <button
                    type="button"
                    className="btn-sm ghost"
                    onClick={() => router.push(routes.idea(idea.id))}
                  >
                    Idea overview
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
