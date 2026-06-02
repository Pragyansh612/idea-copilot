'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  RelatedIdeaAPI,
  type RecommendationItem,
  type RelatedIdeaWithDetails,
  type RelationTypeEnum,
} from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const RELATION_LABELS: Record<string, string> = {
  related: 'Related',
  depends_on: 'Depends on',
  blocks: 'Blocks',
  similar: 'Similar',
  inspired_by: 'Inspired by',
}

type Props = {
  ideaId: string
  onError?: (msg: string) => void
}

export function RelatedIdeasSection({ ideaId, onError }: Props) {
  const router = useRouter()
  const [related, setRelated] = useState<RelatedIdeaWithDetails[]>([])
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(() => new Set())
  const [loading, setLoading] = useState(true)
  const [finding, setFinding] = useState(false)
  const [busy, setBusy] = useState<string | null>(null)

  const loadRelated = useCallback(async () => {
    try {
      setLoading(true)
      const list = await RelatedIdeaAPI.getRelatedIdeas(ideaId)
      setRelated(list)
      setRecommendations([])
      setDismissedRecs(new Set())
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to load related ideas')
    } finally {
      setLoading(false)
    }
  }, [ideaId, onError])

  useEffect(() => {
    void loadRelated()
  }, [loadRelated])

  async function findRelated() {
    try {
      setFinding(true)
      const result = await RelatedIdeaAPI.getRecommendations(ideaId, 5, false)
      setRecommendations(result.recommendations.filter(r => !r.is_already_connected))
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to find related ideas')
    } finally {
      setFinding(false)
    }
  }

  async function acceptRecommendation(rec: RecommendationItem) {
    try {
      setBusy(rec.idea.id)
      await RelatedIdeaAPI.createRelation({
        source_idea_id: ideaId,
        target_idea_id: rec.idea.id,
        relation_type: rec.recommended_relation_type,
        is_ai_suggested: true,
        confidence_score: rec.similarity_score,
      })
      await loadRelated()
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to link idea')
    } finally {
      setBusy(null)
    }
  }

  const visibleRecs = recommendations.filter(r => !dismissedRecs.has(r.idea.id))

  return (
    <div className="dash-card" style={{ padding: 12 }}>
      <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Related ideas</div>

      {loading ? (
        <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>Loading relationships…</p>
      ) : related.length === 0 && visibleRecs.length === 0 ? (
        <div>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 12 }}>
            No related ideas linked yet. Discover connections across your workspace.
          </p>
          <button type="button" className="btn-sm ghost" onClick={() => void findRelated()} disabled={finding}>
            <DI.Sparkles /> {finding ? 'Finding…' : 'Find related ideas'}
          </button>
        </div>
      ) : (
        <>
          <div className="related-ideas-grid">
            {related.map(rel => {
              const other = rel.idea
              const relLabel = RELATION_LABELS[rel.relation_type] || rel.relation_type
              return (
                <button
                  key={rel.id}
                  type="button"
                  className="related-idea-card"
                  onClick={() => router.push(routes.idea(other.id))}
                >
                  <span className="related-idea-type">{relLabel}</span>
                  <span className="related-idea-title">{other.title}</span>
                  {rel.is_ai_suggested && <span className="related-idea-ai">AI suggested</span>}
                </button>
              )
            })}
          </div>
          {visibleRecs.length > 0 && (
            <div style={{ marginTop: 14 }}>
              <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Suggested connections</div>
              <div className="related-ideas-grid">
                {visibleRecs.map(rec => (
                  <div key={rec.idea.id} className="related-idea-card related-idea-card--suggested">
                    <span className="related-idea-type">
                      {RELATION_LABELS[rec.recommended_relation_type] || rec.recommended_relation_type}
                    </span>
                    <span className="related-idea-title">{rec.idea.title}</span>
                    <span className="related-idea-ai">{Math.round(rec.similarity_score * 100)}% match</span>
                    <div className="related-idea-actions">
                      <button
                        type="button"
                        className="btn-sm solid"
                        disabled={busy === rec.idea.id}
                        onClick={() => void acceptRecommendation(rec)}
                      >
                        {busy === rec.idea.id ? '…' : 'Accept'}
                      </button>
                      <button
                        type="button"
                        className="btn-sm ghost"
                        onClick={() => setDismissedRecs(prev => new Set([...prev, rec.idea.id]))}
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            type="button"
            className="btn-sm ghost"
            style={{ marginTop: 12 }}
            onClick={() => void findRelated()}
            disabled={finding}
          >
            <DI.Sparkles /> {finding ? 'Finding…' : 'Find more related ideas'}
          </button>
        </>
      )}
    </div>
  )
}
