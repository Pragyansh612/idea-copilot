'use client'
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { PageEmpty, PageError, PageLoading } from '@/components/dashboard/PageState'
import {
  AIAPI,
  CompetitorAPI,
  FeatureAPI,
  IdeaAPI,
  PhaseAPI,
  type AIGenerateRequest,
  type AISuggestion,
  type Feature,
  type Idea,
  type Phase,
} from '@/lib/api/idea'
import { AttachmentAPI, type Attachment } from '@/lib/api/attachments'
import { ExportAPI } from '@/lib/api/export'
import { CopilotAPI } from '@/lib/api/copilot'
import { CommentsSection } from '@/components/dashboard/CommentsSection'
import { MarkdownMessage } from '@/components/dashboard/MarkdownMessage'
import { ShareModal } from '@/components/dashboard/ShareModal'
import { Toast } from '@/components/dashboard/Toast'
import { type GapItem } from '@/lib/dashboard/gaps'
import { hasGapRun, loadGapsForIdea } from '@/lib/dashboard/gap-storage'
import { expandSuggestions, type SuggestionCard } from '@/lib/dashboard/suggestions'
import { dedupeCompetitorsByUrl, type CompetitorRow } from '@/lib/dashboard/competitor-intel'
import { IdeaSmartAlerts } from '@/components/dashboard/IdeaSmartAlerts'
import { ReadinessChecklist } from '@/components/dashboard/ReadinessChecklist'
import { RelatedIdeasSection } from '@/components/dashboard/RelatedIdeasSection'
import { StartupReadinessScore } from '@/components/dashboard/StartupReadinessScore'
import { buildReadinessItems, computeStartupReadinessPercent, signalsFromIdeaDetail } from '@/lib/dashboard/readiness'
import { ExecutionSection } from '@/components/dashboard/ExecutionSection'
import { formatDate, ideaScore, priorityShort, statusLabel, timeAgo } from '@/lib/dashboard/format'
import { useDashboardChrome } from '@/components/dashboard/DashboardChromeContext'
import { captureError } from '@/lib/monitoring'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const VALID_TABS = ['overview', 'intelligence', 'roadmap', 'copilot', 'discussion', 'attachments'] as const
const SUGGESTION_TYPES: AIGenerateRequest['suggestion_type'][] = ['features', 'phases', 'improvements', 'marketing', 'validation']

const credentialInputStyle: CSSProperties = {
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-2)',
  color: 'var(--fg)',
  font: 'inherit',
  fontSize: 14,
}

export default function IdeaDetailPage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading idea…" /></div>}>
      <IdeaDetailContent />
    </Suspense>
  )
}

function IdeaDetailContent() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const ideaId = params.id as string
  const [tab, setTab] = useState<'overview' | 'intelligence' | 'roadmap' | 'copilot' | 'discussion' | 'attachments'>('overview')
  const [showShare, setShowShare] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const [idea, setIdea] = useState<Idea | null>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [phases, setPhases] = useState<Phase[]>([])
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([])
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([])
  const [gaps, setGaps] = useState<GapItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const [newPhaseName, setNewPhaseName] = useState('')
  const [newPhaseDesc, setNewPhaseDesc] = useState('')
  const [featureDraftByPhase, setFeatureDraftByPhase] = useState<Record<string, { title: string; description: string; priority: Feature['priority'] }>>({})
  const [newFeatureTitle, setNewFeatureTitle] = useState('')
  const [newFeatureDesc, setNewFeatureDesc] = useState('')
  const [newFeaturePriority, setNewFeaturePriority] = useState<Feature['priority']>('medium')
  const [dismissedSuggestionKeys, setDismissedSuggestionKeys] = useState<string[]>([])
  const [suggestionType, setSuggestionType] = useState<AIGenerateRequest['suggestion_type']>('features')
  const [copilotMessages, setCopilotMessages] = useState<Array<{ role: 'user' | 'ai'; text: string; failed?: boolean }>>([])
  const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null)
  const [copilotInput, setCopilotInput] = useState('')
  const [attachments, setAttachments] = useState<Attachment[]>([])
  const [marketGapDone, setMarketGapDone] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [toastVariant, setToastVariant] = useState<'success' | 'error'>('success')
  const [exportBusy, setExportBusy] = useState<'markdown' | 'pdf' | 'notion' | 'trello' | null>(null)
  const [notionFormOpen, setNotionFormOpen] = useState(false)
  const [notionApiKey, setNotionApiKey] = useState('')
  const [notionPageId, setNotionPageId] = useState('')
  const [trelloFormOpen, setTrelloFormOpen] = useState(false)
  const [trelloApiKey, setTrelloApiKey] = useState('')
  const [trelloToken, setTrelloToken] = useState('')
  const [trelloBoard, setTrelloBoard] = useState('MyIdeaCopilot Export')

  // Action-level failures (toggling a feature, generating suggestions, etc.) surface as a
  // dismissible toast — only the initial `load()` failure (see `error` state) should blank
  // the whole page, since every other action failure still leaves a fully-loaded idea behind it.
  function showError(message: string) {
    setToastVariant('error')
    setToast(message)
  }
  function showSuccess(message: string) {
    setToastVariant('success')
    setToast(message)
  }
  const [editingDescription, setEditingDescription] = useState(false)
  const [descriptionDraft, setDescriptionDraft] = useState('')
  const [editingTargetMarket, setEditingTargetMarket] = useState(false)
  const [targetMarketDraft, setTargetMarketDraft] = useState('')
  const [editingScores, setEditingScores] = useState(false)
  const [effortDraft, setEffortDraft] = useState('')
  const [impactDraft, setImpactDraft] = useState('')
  const [interestDraft, setInterestDraft] = useState('')
  const phaseNameRef = useRef<HTMLInputElement>(null)
  const welcomedRef = useRef(false)
  const { setIdeaDetailTitle } = useDashboardChrome()

  useEffect(() => {
    return () => setIdeaDetailTitle(null)
  }, [setIdeaDetailTitle])

  useEffect(() => {
    if (searchParams.get('created') !== '1' || loading || !idea || welcomedRef.current) return
    welcomedRef.current = true
    showSuccess('Idea created! Work through the checklist below — each step takes about a minute.')
    setTab('overview')
    if (!idea.description?.trim()) {
      setDescriptionDraft('')
      setEditingDescription(true)
    }
    requestAnimationFrame(() => {
      document.getElementById('readiness-checklist')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
    router.replace(routes.idea(ideaId), { scroll: false })
  }, [searchParams, loading, idea, ideaId, router])

  useEffect(() => {
    const t = searchParams.get('tab')
    const mapped =
      t === 'phases' ? 'roadmap' :
      t === 'comp' ? 'intelligence' :
      t === 'ai' ? 'copilot' :
      t === 'features' ? 'overview' :
      t === 'attachments' ? 'attachments' :
      t === 'comments' ? 'discussion' :
      t
    if (mapped && (VALID_TABS as readonly string[]).includes(mapped)) {
      setTab(mapped as typeof tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (searchParams.get('focus') === 'phase' && tab === 'roadmap') {
      phaseNameRef.current?.focus()
      phaseNameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [searchParams, tab])

  const showExportPanel = searchParams.get('action') === 'export'

  useEffect(() => {
    if (searchParams.get('action') === 'export') {
      setTab('overview')
    }
  }, [searchParams])

  useEffect(() => {
    if (!ideaId) return
    setGaps(loadGapsForIdea(ideaId))
    setMarketGapDone(hasGapRun(ideaId))
  }, [ideaId])

  const load = useCallback(async () => {
    if (!ideaId) return
    try {
      setLoading(true)
      setError(null)
      const detail = await IdeaAPI.getIdea(ideaId)
      const [sugs, comp, atts, me] = await Promise.all([
        AIAPI.getSuggestions(ideaId).catch(() => []),
        CompetitorAPI.getCompetitorResearch(ideaId).catch(() => ({ research: [] })),
        AttachmentAPI.listForIdea(ideaId).catch(() => []),
        import('@/lib/api/auth').then(m => m.AuthAPI.getMe()).catch(() => null),
      ])
      if (me) setCurrentUserId(me.id)
      setIdea(detail.idea)
      setIdeaDetailTitle(detail.idea.title)
      setDescriptionDraft(detail.idea.description || '')
      setTargetMarketDraft(detail.idea.target_market || '')
      setFeatures(detail.features || [])
      setPhases(detail.phases || [])
      setSuggestions(sugs)
      setDismissedSuggestionKeys([])
      setCompetitors(
        dedupeCompetitorsByUrl((comp.research || comp.competitors || []) as CompetitorRow[]),
      )
      setAttachments(atts)
      setGaps(loadGapsForIdea(ideaId))
      setMarketGapDone(hasGapRun(ideaId))
      setCopilotMessages([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load idea')
      setIdea(null)
    } finally {
      setLoading(false)
    }
  }, [ideaId, setIdeaDetailTitle])

  /** Refresh features/phases/suggestions without blanking the page or clearing Copilot. */
  const softRefreshLists = useCallback(async () => {
    if (!ideaId) return
    try {
      const [detail, sugs] = await Promise.all([
        IdeaAPI.getIdea(ideaId),
        AIAPI.getSuggestions(ideaId).catch(() => null),
      ])
      setIdea(detail.idea)
      setFeatures(detail.features || [])
      setPhases(detail.phases || [])
      if (sugs) setSuggestions(sugs)
    } catch {
      /* keep local state; action already updated optimistically */
    }
  }, [ideaId])

  useEffect(() => {
    load()
  }, [load])

  async function toggleFeature(feature: Feature) {
    const next = !feature.is_completed
    setFeatures(prev =>
      prev.map(f =>
        f.id === feature.id
          ? { ...f, is_completed: next, completed_at: next ? new Date().toISOString() : undefined }
          : f,
      ),
    )
    try {
      const updated = await FeatureAPI.updateFeature(feature.id, { is_completed: next })
      setFeatures(prev => prev.map(f => (f.id === feature.id ? updated : f)))
      // Refresh idea progress % without full-page load
      IdeaAPI.getIdea(ideaId)
        .then(detail => setIdea(detail.idea))
        .catch(() => {})
    } catch (err) {
      setFeatures(prev => prev.map(f => (f.id === feature.id ? feature : f)))
      showError(err instanceof Error ? err.message : 'Failed to update feature')
    }
  }

  async function togglePhaseComplete(phase: Phase) {
    const next = !phase.is_completed
    setPhases(prev => prev.map(p => (p.id === phase.id ? { ...p, is_completed: next } : p)))
    try {
      const updated = await PhaseAPI.updatePhase(phase.id, { is_completed: next })
      setPhases(prev => prev.map(p => (p.id === phase.id ? updated : p)))
    } catch (err) {
      setPhases(prev => prev.map(p => (p.id === phase.id ? phase : p)))
      showError(err instanceof Error ? err.message : 'Failed to update phase')
    }
  }

  async function createPhase() {
    if (!newPhaseName.trim()) return
    try {
      setBusyAction('phase')
      const phase = await PhaseAPI.createPhase(ideaId, {
        name: newPhaseName.trim(),
        description: newPhaseDesc.trim() || undefined,
        order_index: phases.length,
      })
      setPhases(prev => [...prev, phase])
      setNewPhaseName('')
      setNewPhaseDesc('')
      showSuccess(`Phase “${phase.name}” added.`)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to create phase')
    } finally {
      setBusyAction(null)
    }
  }

  async function addFeatureToPhase(phaseId: string) {
    const draft = featureDraftByPhase[phaseId]
    const title = (draft?.title || '').trim()
    if (!title) return
    const dup = features.some(f => f.title.trim().toLowerCase() === title.toLowerCase())
    if (dup) {
      showError(`Feature “${title}” already exists.`)
      return
    }
    try {
      setBusyAction(`feature:${phaseId}`)
      const feature = await FeatureAPI.createFeatureForPhase(phaseId, {
        title,
        description: draft?.description?.trim() || undefined,
        priority: draft?.priority || 'medium',
      })
      setFeatures(prev => [...prev, feature])
      setFeatureDraftByPhase(prev => ({
        ...prev,
        [phaseId]: { title: '', description: '', priority: 'medium' },
      }))
      showSuccess(`Added “${feature.title}” to phase.`)
      void softRefreshLists()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add feature')
    } finally {
      setBusyAction(null)
    }
  }

  async function createFeatureOnIdea() {
    const title = newFeatureTitle.trim()
    if (!title) return
    if (features.some(f => f.title.trim().toLowerCase() === title.toLowerCase())) {
      showError(`Feature “${title}” already exists.`)
      return
    }
    try {
      setBusyAction('feature:scope')
      const feature = await FeatureAPI.createFeatureForIdea(ideaId, {
        title,
        description: newFeatureDesc.trim() || undefined,
        priority: newFeaturePriority,
      })
      setFeatures(prev => [...prev, feature])
      setNewFeatureTitle('')
      setNewFeatureDesc('')
      setNewFeaturePriority('medium')
      showSuccess(`Added “${feature.title}” to feature scope.`)
      void softRefreshLists()
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to add feature')
    } finally {
      setBusyAction(null)
    }
  }

  async function generateSuggestions() {
    try {
      setBusyAction('suggest')
      await AIAPI.generateSuggestions({ idea_id: ideaId, suggestion_type: suggestionType })
      const fresh = await AIAPI.getSuggestions(ideaId)
      setSuggestions(fresh)
      setDismissedSuggestionKeys([])
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate AI suggestions')
    } finally {
      setBusyAction(null)
    }
  }

  async function addSuggestionCard(card: SuggestionCard) {
    const titleKey = card.title.trim().toLowerCase()
    if (
      card.itemType === 'feature' &&
      features.some(f => f.title.trim().toLowerCase() === titleKey)
    ) {
      setDismissedSuggestionKeys(prev => (prev.includes(card.key) ? prev : [...prev, card.key]))
      showError(`Feature “${card.title}” is already in scope.`)
      return
    }
    if (
      card.itemType === 'phase' &&
      phases.some(p => p.name.trim().toLowerCase() === titleKey)
    ) {
      setDismissedSuggestionKeys(prev => (prev.includes(card.key) ? prev : [...prev, card.key]))
      showError(`Phase “${card.title}” already exists.`)
      return
    }

    setDismissedSuggestionKeys(prev => (prev.includes(card.key) ? prev : [...prev, card.key]))
    try {
      setBusyAction(`apply:${card.key}`)
      const desc =
        card.body.trim() === card.title.trim()
          ? card.userBenefit || card.body
          : card.body
      const res = await AIAPI.createFromSuggestion({
        suggestion_id: card.suggestionId,
        item_type: card.itemType,
        idea_id: ideaId,
        title: card.title,
        description: desc,
        priority: card.priority,
      })
      if (res.feature) {
        setFeatures(prev =>
          prev.some(f => f.id === res.feature!.id) ? prev : [...prev, res.feature!],
        )
      }
      if (res.phase) {
        setPhases(prev =>
          prev.some(p => p.id === res.phase!.id) ? prev : [...prev, res.phase!],
        )
      }
      showSuccess(`Added “${card.title}” as a ${card.itemType}.`)
      void softRefreshLists()
    } catch (err) {
      setDismissedSuggestionKeys(prev => prev.filter(k => k !== card.key))
      showError(err instanceof Error ? err.message : 'Failed to add suggestion')
    } finally {
      setBusyAction(null)
    }
  }

  async function uploadAttachment(file: File) {
    try {
      setBusyAction('upload')
      const att = await AttachmentAPI.upload(ideaId, file)
      setAttachments(prev => [att, ...prev])
      showSuccess('File uploaded.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusyAction(null)
    }
  }

  async function downloadMarkdownExport() {
    try {
      setExportBusy('markdown')
      const { markdown } = await ExportAPI.exportMarkdown(ideaId)
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${idea?.title || 'idea'}.md`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('Markdown export downloaded.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function downloadPdfExport() {
    try {
      setExportBusy('pdf')
      const { pdfBase64 } = await ExportAPI.exportPdf(ideaId)
      const bin = atob(pdfBase64)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      const blob = new Blob([bytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${idea?.title || 'idea'}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      showSuccess('PDF export downloaded.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'PDF export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function exportToNotion() {
    if (!notionApiKey.trim() || !notionPageId.trim()) {
      showError('Notion integration token and parent page ID are both required.')
      return
    }
    try {
      setExportBusy('notion')
      const { pagesCreated } = await ExportAPI.exportNotion(ideaId, notionApiKey.trim(), notionPageId.trim())
      showSuccess(`Exported to Notion — ${pagesCreated} page${pagesCreated === 1 ? '' : 's'} created.`)
      setNotionFormOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Notion export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function exportToTrello() {
    if (!trelloApiKey.trim() || !trelloToken.trim()) {
      showError('Trello API key and token are both required.')
      return
    }
    try {
      setExportBusy('trello')
      const { cardsCreated } = await ExportAPI.exportTrello(ideaId, trelloApiKey.trim(), trelloToken.trim(), trelloBoard.trim())
      showSuccess(`Exported to Trello — ${cardsCreated} card${cardsCreated === 1 ? '' : 's'} created.`)
      setTrelloFormOpen(false)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Trello export failed')
    } finally {
      setExportBusy(null)
    }
  }

  async function saveDescription() {
    const text = descriptionDraft.trim()
    if (!text) return
    try {
      setBusyAction('description')
      const updated = await IdeaAPI.updateIdea(ideaId, { description: text })
      setIdea(updated)
      setEditingDescription(false)
      showSuccess('Description saved.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save description')
    } finally {
      setBusyAction(null)
    }
  }

  async function saveTargetMarket() {
    try {
      setBusyAction('target_market')
      const updated = await IdeaAPI.updateIdea(ideaId, { target_market: targetMarketDraft.trim() })
      setIdea(updated)
      setEditingTargetMarket(false)
      showSuccess('Target market saved.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save target market')
    } finally {
      setBusyAction(null)
    }
  }

  async function saveScores() {
    const effort = Number(effortDraft)
    const impact = Number(impactDraft)
    const interest = Number(interestDraft)
    const inRange = (n: number) => Number.isInteger(n) && n >= 1 && n <= 10
    if (!inRange(effort) || !inRange(impact) || !inRange(interest)) {
      showError('Effort, impact, and interest must each be a whole number from 1 to 10.')
      return
    }
    try {
      setBusyAction('scores')
      const updated = await IdeaAPI.updateIdea(ideaId, {
        effort_score: effort,
        impact_score: impact,
        interest_score: interest,
      })
      setIdea(updated)
      setEditingScores(false)
      showSuccess('Scores saved.')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save scores')
    } finally {
      setBusyAction(null)
    }
  }

  async function sendCopilot(message?: string) {
    const text = (message ?? copilotInput).trim()
    if (!text) return
    setCopilotInput('')
    setBusyAction('copilot')
    setLastFailedMessage(null)
    setCopilotMessages(prev => [...prev, { role: 'user', text }])
    try {
      const res = await CopilotAPI.chat({ query: text, idea_id: ideaId })
      setCopilotMessages(prev => [...prev, { role: 'ai', text: res.response }])
    } catch (err) {
      setCopilotMessages(prev =>
        prev.map((m, i) => (i === prev.length - 1 ? { ...m, failed: true } : m)),
      )
      setLastFailedMessage(text)
      showError(err instanceof Error ? err.message : 'Copilot request failed. Click retry to try again.')
      captureError(err, { ideaId, flow: 'copilot-chat-inline' })
    } finally {
      setBusyAction(null)
    }
  }

  const handleCopilotRetry = useCallback(() => {
    if (!lastFailedMessage) return
    const text = lastFailedMessage
    setLastFailedMessage(null)
    setCopilotMessages(prev => prev.slice(0, -1))
    void sendCopilot(text)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sendCopilot is stable within this component's render
  }, [lastFailedMessage])

  const featuresByPhase = useMemo(() => {
    const byPhase: Record<string, { total: number; done: number; items: Feature[] }> = {}
    for (const f of features) {
      if (!f.phase_id) continue
      if (!byPhase[f.phase_id]) byPhase[f.phase_id] = { total: 0, done: 0, items: [] }
      byPhase[f.phase_id].total += 1
      byPhase[f.phase_id].items.push(f)
      if (f.is_completed) byPhase[f.phase_id].done += 1
    }
    return byPhase
  }, [features])

  const openFeatures = useMemo(() => {
    const seen = new Set<string>()
    return features.filter(f => {
      if (f.is_completed) return false
      const key = f.title.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [features])
  const completedFeatures = useMemo(() => {
    const seen = new Set<string>()
    return features.filter(f => {
      if (!f.is_completed) return false
      const key = f.title.trim().toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }, [features])
  const unscopedFeatures = useMemo(() => features.filter(f => !f.phase_id), [features])

  const suggestionCards = useMemo(() => {
    const existingTitles = [
      ...features.map(f => f.title),
      ...phases.map(p => p.name),
    ]
    return expandSuggestions(suggestions, {
      existingTitles,
      dismissedKeys: dismissedSuggestionKeys,
    })
  }, [suggestions, features, phases, dismissedSuggestionKeys])

  const competitorPreview = useMemo(() => {
    return competitors.slice(0, 5).map((c, i) => ({
      id: String(c.id || c.competitor_url || `comp-${i}`),
      name: String(c.competitor_name || c.name || c.competitor_url || 'Competitor'),
      position: typeof c.market_position === 'string' ? c.market_position : undefined,
    }))
  }, [competitors])

  const gapPreview = useMemo(() => gaps.slice(0, 5), [gaps])

  const readinessSignals = useMemo(
    () =>
      signalsFromIdeaDetail({
        description: idea?.description,
        featureCount: features.length,
        phaseCount: phases.length,
        competitorCount: competitors.length,
        ideaId,
      }),
    [idea?.description, features.length, phases.length, competitors.length, ideaId],
  )

  if (loading) {
    return <div className="page"><PageLoading label="Loading idea…" /></div>
  }

  if (error || !idea) {
    return (
      <div className="page">
        <PageError message={error || 'Idea not found'} onRetry={load} />
        <button type="button" className="btn-sm ghost" style={{ marginTop: 12 }} onClick={() => router.push(routes.ideas)}>
          Back to ideas
        </button>
      </div>
    )
  }

  const score = ideaScore(idea)
  const readinessPercent = computeStartupReadinessPercent(readinessSignals)
  const isLaunchReady = readinessPercent >= 100
  const readiness = buildReadinessItems({
    signals: readinessSignals,
    onDescribe: () => {
      setTab('overview')
      setDescriptionDraft(idea.description || '')
      setEditingDescription(true)
      requestAnimationFrame(() => {
        document.getElementById('idea-description')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    },
    onGenerateFeatures: () => {
      setTab('overview')
      setSuggestionType('features')
      void generateSuggestions()
    },
    onCreateRoadmap: () => {
      setTab('roadmap')
      router.replace(routes.ideaTab(ideaId, 'roadmap', { focus: 'phase' }), { scroll: false })
      requestAnimationFrame(() => phaseNameRef.current?.focus())
    },
    onDiscoverCompetitors: () => router.push(routes.intelligenceDiscover(ideaId)),
    onRunMarketGap: () => router.push(routes.intelligenceGapAnalysis(ideaId)),
  })
  const topCompetitorNames = competitors
    .slice(0, 2)
    .map(c => String(c.competitor_name || c.name || '').trim())
    .filter(Boolean)
  const topGapTitle = gaps[0]?.title
  const copilotPrompts = [
    topCompetitorNames.length > 0
      ? `How does ${idea.title} compare to ${topCompetitorNames.join(' and ')}?`
      : `Find market gaps for ${idea.title}`,
    topGapTitle
      ? `Help me evaluate this opportunity: "${topGapTitle}"`
      : `Generate features for ${idea.title}`,
    readinessSignals.hasPhases
      ? `What should I build next in ${idea.title}?`
      : `What should I build first in ${idea.title}?`,
  ]

  return (
    <div className="page">
      {toast && <Toast message={toast} variant={toastVariant} onDismiss={() => setToast(null)} />}
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Idea · {statusLabel(idea.status)} · {idea.priority} priority</div>
          <h1><em>{idea.title}</em></h1>
          <div className="ph-meta-chips">
            <span className="pill accent">{statusLabel(idea.status)}</span>
            <span className="pill">{formatDate(idea.created_at)}</span>
            <span className="pill">Updated {timeAgo(idea.updated_at)}</span>
            {(idea.tags?.length ?? 0) > 0 && idea.tags.slice(0, 4).map(t => (
              <span key={t} className="pill">{t}</span>
            ))}
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>
            <DI.CaretRight style={{ transform: 'rotate(180deg)' }}/> Back
          </button>
          <button
            type="button"
            className="btn-sm ghost"
            onClick={() => router.push(routes.ideaExport(ideaId))}
            aria-current={showExportPanel ? 'true' : undefined}
          >
            <DI.Export/> Export
          </button>
          <button
            type="button"
            className="btn-sm ghost"
            title="Attachments for this idea"
            onClick={() => router.push(routes.ideaAttachments(ideaId))}
          >
            <DI.Folder/> Attachments
          </button>
          <button type="button" className="btn-sm ghost" onClick={() => setShowShare(true)}>
            <DI.Users/> Share
          </button>
          <button type="button" className="btn-sm solid" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
            <DI.Spark/> Ask Copilot
          </button>
        </div>
      </div>

      {showShare && (
        <ShareModal ideaId={ideaId} ideaTitle={idea.title} onClose={() => setShowShare(false)} />
      )}

      <IdeaSmartAlerts
        ideaId={ideaId}
        idea={idea}
        phases={phases}
        features={features}
        competitors={competitors}
      />

      {showExportPanel && (
        <div className="idea-export-banner dash-card">
          <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Export idea</div>
          <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 12 }}>
            Download this idea from your workspace via the export API.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button type="button" className="btn-sm solid" onClick={() => void downloadMarkdownExport()} disabled={exportBusy !== null}>
              <DI.Export /> {exportBusy === 'markdown' ? 'Exporting…' : 'Markdown'}
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => void downloadPdfExport()} disabled={exportBusy !== null}>
              <DI.Doc /> {exportBusy === 'pdf' ? 'Exporting…' : 'PDF'}
            </button>
            <button
              type="button"
              className="btn-sm ghost"
              onClick={() => { setNotionFormOpen(v => !v); setTrelloFormOpen(false) }}
              disabled={exportBusy !== null}
              aria-expanded={notionFormOpen}
            >
              <DI.Doc /> Notion
            </button>
            <button
              type="button"
              className="btn-sm ghost"
              onClick={() => { setTrelloFormOpen(v => !v); setNotionFormOpen(false) }}
              disabled={exportBusy !== null}
              aria-expanded={trelloFormOpen}
            >
              <DI.Doc /> Trello
            </button>
            <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.copilotForIdea(ideaId))}>
              <DI.Spark/> Draft with Copilot
            </button>
          </div>

          {notionFormOpen && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12, maxWidth: 420 }}>
              <p style={{ color: 'var(--fg-3)', fontSize: 12, margin: 0 }}>
                Paste a Notion internal integration token (share your target page with it first) and the parent page ID to export into. Nothing is saved — sent only for this export.
              </p>
              <input
                type="password"
                placeholder="Notion integration token (secret_...)"
                value={notionApiKey}
                onChange={e => setNotionApiKey(e.target.value)}
                autoComplete="off"
                style={credentialInputStyle}
              />
              <input
                type="text"
                placeholder="Parent page ID"
                value={notionPageId}
                onChange={e => setNotionPageId(e.target.value)}
                autoComplete="off"
                style={credentialInputStyle}
              />
              <button type="button" className="btn-sm solid" onClick={() => void exportToNotion()} disabled={exportBusy !== null} style={{ justifySelf: 'start' }}>
                <DI.Export /> {exportBusy === 'notion' ? 'Exporting…' : 'Export to Notion'}
              </button>
            </div>
          )}

          {trelloFormOpen && (
            <div style={{ display: 'grid', gap: 8, marginTop: 12, maxWidth: 420 }}>
              <p style={{ color: 'var(--fg-3)', fontSize: 12, margin: 0 }}>
                Paste a Trello API key and token (from trello.com/app-key). Nothing is saved — sent only for this export.
              </p>
              <input
                type="password"
                placeholder="Trello API key"
                value={trelloApiKey}
                onChange={e => setTrelloApiKey(e.target.value)}
                autoComplete="off"
                style={credentialInputStyle}
              />
              <input
                type="password"
                placeholder="Trello token"
                value={trelloToken}
                onChange={e => setTrelloToken(e.target.value)}
                autoComplete="off"
                style={credentialInputStyle}
              />
              <input
                type="text"
                placeholder="Board name"
                value={trelloBoard}
                onChange={e => setTrelloBoard(e.target.value)}
                autoComplete="off"
                style={credentialInputStyle}
              />
              <button type="button" className="btn-sm solid" onClick={() => void exportToTrello()} disabled={exportBusy !== null} style={{ justifySelf: 'start' }}>
                <DI.Export /> {exportBusy === 'trello' ? 'Exporting…' : 'Export to Trello'}
              </button>
            </div>
          )}
        </div>
      )}

      <div className="idea-detail">
        <div className="id-center">
          <div className="id-strip dash-card">
            <div className="id-strip-bar">
              <div className="label"><span>Score</span><span>{score} / 100</span></div>
              <div className="bar"><div className="fill" style={{ width: `${score}%` }}/></div>
            </div>
            <div className="id-strip-bar">
              <div className="label"><span>Progress</span><span>{idea.progress_percentage ?? 0}%</span></div>
              <div className="bar"><div className="fill" style={{ width: `${idea.progress_percentage ?? 0}%` }}/></div>
            </div>
            <div className="id-strip-item">
              <span className="k">Features</span>
              <span className="v">{openFeatures.length} open · {completedFeatures.length} done</span>
            </div>
            <div className="id-strip-item">
              <span className="k">Phases</span>
              <span className="v">{phases.filter(p => p.is_completed).length}/{phases.length}</span>
            </div>
            <div className="id-strip-item">
              <span className="k">Competitors</span>
              <span className="v">{competitors.length}</span>
            </div>
            <div className="id-strip-item">
              <span className="k">AI pending</span>
              <span className="v">{suggestionCards.length}</span>
            </div>
          </div>

          <div className="id-tabs">
            {[
              { id: 'overview', label: 'Overview', count: '' },
              { id: 'intelligence', label: 'Intelligence', count: String(competitors.length) },
              { id: 'roadmap', label: 'Roadmap', count: String(phases.length) },
              { id: 'copilot', label: 'Copilot', count: '' },
              { id: 'discussion', label: 'Discussion', count: '' },
              { id: 'attachments', label: 'Attachments', count: String(attachments.length) },
            ].map(t => (
              <button
                key={t.id}
                type="button"
                className={`id-tab ${tab === t.id ? 'active' : ''}`}
                onClick={() => {
                  setTab(t.id as typeof tab)
                  router.replace(routes.ideaTab(ideaId, t.id), { scroll: false })
                }}
              >
                {t.label} {t.count && <span className="count">{t.count}</span>}
              </button>
            ))}
          </div>

          {tab === 'overview' && (
            <div className="id-panel">
              <div className="id-panel-head">
                <h3>Overview</h3>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {!editingDescription && (
                <div className="dash-card" style={{ padding: 12 }} id="idea-description-view">
                  <div className="id-panel-head" style={{ marginBottom: 8, padding: 0, border: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="eyebrow-mono">Description</div>
                    <button
                      type="button"
                      className="btn-sm ghost"
                      onClick={() => {
                        setDescriptionDraft(idea.description || '')
                        setEditingDescription(true)
                      }}
                    >
                      Edit
                    </button>
                  </div>
                  <p style={{ margin: 0, fontSize: 14, color: idea.description?.trim() ? 'var(--fg-2)' : 'var(--fg-3)', lineHeight: 1.55 }}>
                    {idea.description?.trim() || 'No description yet — add one so Copilot and competitor discovery stay on target.'}
                  </p>
                </div>
                )}
                <div className="dash-card" style={{ padding: 12 }}>
                  <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="eyebrow-mono">Scores</div>
                    {!editingScores && (
                      <button
                        type="button"
                        className="btn-sm ghost"
                        onClick={() => {
                          setEffortDraft(idea.effort_score != null ? String(idea.effort_score) : '')
                          setImpactDraft(idea.impact_score != null ? String(idea.impact_score) : '')
                          setInterestDraft(idea.interest_score != null ? String(idea.interest_score) : '')
                          setEditingScores(true)
                        }}
                      >
                        Edit
                      </button>
                    )}
                  </div>
                  {editingScores ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--fg-3)' }}>
                        Rate 1–10. Overall is computed automatically as (impact + interest) / effort.
                      </p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0,1fr))', gap: 8 }}>
                        {([
                          ['Effort', effortDraft, setEffortDraft],
                          ['Impact', impactDraft, setImpactDraft],
                          ['Interest', interestDraft, setInterestDraft],
                        ] as const).map(([label, val, setVal]) => (
                          <label key={label} style={{ display: 'grid', gap: 4 }}>
                            <span className="eyebrow-mono">{label}</span>
                            <input
                              type="number"
                              min={1}
                              max={10}
                              step={1}
                              value={val}
                              onChange={e => setVal(e.target.value)}
                              style={{
                                padding: '8px 10px',
                                borderRadius: 8,
                                border: '1px solid var(--line-2)',
                                background: 'var(--bg-2)',
                                color: 'var(--fg)',
                                font: 'inherit',
                                fontSize: 14,
                              }}
                            />
                          </label>
                        ))}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button type="button" className="btn-sm solid" onClick={() => void saveScores()} disabled={busyAction === 'scores'}>
                          {busyAction === 'scores' ? 'Saving…' : 'Save scores'}
                        </button>
                        <button type="button" className="btn-sm ghost" onClick={() => setEditingScores(false)} disabled={busyAction === 'scores'}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0,1fr))', gap: 8 }}>
                      {[
                        ['Effort', idea.effort_score ?? '—'],
                        ['Impact', idea.impact_score ?? '—'],
                        ['Interest', idea.interest_score ?? '—'],
                        ['Overall', idea.overall_score ?? score],
                      ].map(([k, v]) => (
                        <div key={String(k)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: '8px 10px' }}>
                          <div className="eyebrow-mono">{k}</div>
                          <div style={{ marginTop: 4, fontSize: 16, fontWeight: 500 }}>{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dash-card" style={{ padding: 12 }} id="readiness-checklist">
                  <div className="readiness-overview-row">
                    <div>
                      <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Startup Readiness</div>
                      <p style={{ color: 'var(--fg-2)', fontSize: 13, margin: 0, maxWidth: '36ch' }}>
                        Complete each step to validate your idea before you build.
                      </p>
                    </div>
                    <StartupReadinessScore signals={readinessSignals} size="lg" />
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <ReadinessChecklist items={readiness} />
                  </div>
                </div>
                {isLaunchReady && idea && (
                  <ExecutionSection
                    ideaId={ideaId}
                    idea={idea}
                    features={features}
                    phases={phases}
                    competitorCount={competitors.length}
                    onError={setError}
                  />
                )}
                {(editingDescription || !idea.description?.trim()) && (
                  <div className="dash-card" style={{ padding: 12 }} id="idea-description">
                    <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Idea description</div>
                    <textarea
                      value={descriptionDraft}
                      onChange={e => setDescriptionDraft(e.target.value)}
                      rows={4}
                      placeholder="Describe the problem, audience, and solution…"
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', font: 'inherit', fontSize: 14, resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                      <button type="button" className="btn-sm solid" onClick={() => void saveDescription()} disabled={busyAction === 'description' || !descriptionDraft.trim()}>
                        {busyAction === 'description' ? 'Saving…' : 'Save description'}
                      </button>
                      {idea.description?.trim() && (
                        <button type="button" className="btn-sm ghost" onClick={() => setEditingDescription(false)}>Cancel</button>
                      )}
                    </div>
                  </div>
                )}
                <div className="dash-card" style={{ padding: 12 }} id="idea-target-market">
                  <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Target market</div>
                  {editingTargetMarket ? (
                    <>
                      <input
                        value={targetMarketDraft}
                        onChange={e => setTargetMarketDraft(e.target.value)}
                        placeholder="e.g. Engineering managers at remote-first startups with 10–50 person teams"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', font: 'inherit', fontSize: 14 }}
                      />
                      <p style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 6 }}>Helps competitor discovery find more relevant results</p>
                      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <button type="button" className="btn-sm solid" onClick={() => void saveTargetMarket()} disabled={busyAction === 'target_market'}>
                          {busyAction === 'target_market' ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="btn-sm ghost"
                          onClick={() => {
                            setTargetMarketDraft(idea.target_market || '')
                            setEditingTargetMarket(false)
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <p style={{ color: idea.target_market?.trim() ? 'var(--fg-2)' : 'var(--fg-3)', fontSize: 14, margin: 0 }}>
                        {idea.target_market?.trim() || 'Not set — helps competitor discovery find more relevant results.'}
                      </p>
                      <button
                        type="button"
                        className="btn-sm ghost"
                        onClick={() => {
                          setTargetMarketDraft(idea.target_market || '')
                          setEditingTargetMarket(true)
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  )}
                </div>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Generate AI Suggestions</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                    <select className="dash-select" value={suggestionType} onChange={e => setSuggestionType(e.target.value as typeof suggestionType)}>
                      {SUGGESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <button type="button" className="btn-sm solid" onClick={generateSuggestions} disabled={busyAction === 'suggest'}>
                      <DI.Sparkles /> {busyAction === 'suggest' ? 'Generating…' : 'Generate AI Suggestions'}
                    </button>
                  </div>
                  {suggestionCards.length === 0 ? (
                    <p style={{ color: 'var(--fg-2)' }}>
                      {suggestions.length === 0
                        ? 'No suggestions yet. Generate to get ranked feature ideas.'
                        : 'All suggestions from this batch are already in Feature scope or applied.'}
                    </p>
                  ) : (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {suggestionCards.map(card => (
                        <div key={card.key} className="sug-card">
                          <span className="s-label"><DI.Sparkles/> {card.suggestionType}</span>
                          <div className="s-title">{card.title}</div>
                          {(card.priority || card.estimatedEffort != null) && (
                            <div className="s-meta">
                              {card.priority && <span className="chip">{card.priority}</span>}
                              {card.estimatedEffort != null && (
                                <span className="chip">effort {String(card.estimatedEffort)}</span>
                              )}
                            </div>
                          )}
                          {card.body && card.body !== card.title && (
                            <div className="s-body">{card.body}</div>
                          )}
                          {card.userBenefit && card.userBenefit.trim() !== card.body.trim() && (
                            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--fg-3)', lineHeight: 1.45 }}>
                              Benefit: {card.userBenefit}
                            </p>
                          )}
                          <div className="s-actions">
                            <button
                              type="button"
                              className="s-act accept"
                              onClick={() => void addSuggestionCard(card)}
                              disabled={busyAction === `apply:${card.key}`}
                            >
                              {busyAction === `apply:${card.key}` ? 'Adding…' : `Add as ${card.itemType}`}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="dash-card" style={{ padding: 12 }}>
                  <div className="id-panel-head" style={{ marginBottom: 10, padding: 0, border: 0 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 500 }}>Feature scope</h3>
                  </div>
                  <div style={{ display: 'grid', gap: 8, marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)' }}>
                    <div className="eyebrow-mono">Add feature</div>
                    <input
                      value={newFeatureTitle}
                      onChange={e => setNewFeatureTitle(e.target.value)}
                      placeholder="Feature title"
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          void createFeatureOnIdea()
                        }
                      }}
                    />
                    <textarea
                      value={newFeatureDesc}
                      onChange={e => setNewFeatureDesc(e.target.value)}
                      placeholder="Optional details (why it matters, acceptance notes…)"
                      rows={2}
                      style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', resize: 'vertical' }}
                    />
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      <select
                        className="dash-select"
                        value={newFeaturePriority}
                        onChange={e => setNewFeaturePriority(e.target.value as Feature['priority'])}
                      >
                        <option value="high">high</option>
                        <option value="medium">medium</option>
                        <option value="low">low</option>
                      </select>
                      <button
                        type="button"
                        className="btn-sm solid"
                        onClick={() => void createFeatureOnIdea()}
                        disabled={busyAction === 'feature:scope' || !newFeatureTitle.trim()}
                      >
                        <DI.Plus /> {busyAction === 'feature:scope' ? 'Adding…' : 'Add feature'}
                      </button>
                    </div>
                  </div>
                  {features.length === 0 ? (
                    <p style={{ color: 'var(--fg-2)' }}>No features yet. Generate suggestions above or add one here.</p>
                  ) : (
                    <div style={{ display: 'grid', gap: 14 }}>
                      <div>
                        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>
                          Open · {openFeatures.length}
                        </div>
                        {openFeatures.length === 0 ? (
                          <p style={{ color: 'var(--fg-3)', fontSize: 13, margin: 0 }}>Nothing open — nice work.</p>
                        ) : (
                          <div className="feat-list">
                            {openFeatures.map(f => (
                              <div
                                key={f.id}
                                className="feat-item"
                                role="button"
                                tabIndex={0}
                                onClick={() => void toggleFeature(f)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    void toggleFeature(f)
                                  }
                                }}
                              >
                                <span className="ck" />
                                <span className={`prio ${f.priority}`}>{priorityShort(f.priority)}</span>
                                <span className="label">{f.title}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      {completedFeatures.length > 0 && (
                        <div>
                          <div className="eyebrow-mono" style={{ marginBottom: 8 }}>
                            Completed · {completedFeatures.length}
                          </div>
                          <div className="feat-list">
                            {completedFeatures.map(f => (
                              <div
                                key={f.id}
                                className="feat-item done"
                                role="button"
                                tabIndex={0}
                                onClick={() => void toggleFeature(f)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault()
                                    void toggleFeature(f)
                                  }
                                }}
                              >
                                <span className="ck"><DI.Check/></span>
                                <span className={`prio ${f.priority}`}>{priorityShort(f.priority)}</span>
                                <span className="label">{f.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <RelatedIdeasSection ideaId={ideaId} onError={setError} />
              </div>
            </div>
          )}

          {tab === 'roadmap' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Roadmap</h3></div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Add Phase</div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <input
                    ref={phaseNameRef}
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                    placeholder="Phase name"
                    value={newPhaseName}
                    onChange={e => setNewPhaseName(e.target.value)}
                  />
                  <textarea
                    style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                    placeholder="Phase description"
                    value={newPhaseDesc}
                    onChange={e => setNewPhaseDesc(e.target.value)}
                    rows={2}
                  />
                  <button type="button" className="btn-sm solid" onClick={createPhase} disabled={busyAction === 'phase'}>
                    <DI.Plus /> {busyAction === 'phase' ? 'Adding…' : 'Add Phase'}
                  </button>
                </div>
              </div>
              {phases.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No phases yet. Add a phase, then attach features from Feature scope or create new ones here.</p>
              ) : (
                <div className="phases">
                  {phases.map((p, i) => {
                    const phaseFeatures = featuresByPhase[p.id]?.items ?? []
                    const draft = featureDraftByPhase[p.id] ?? { title: '', description: '', priority: 'medium' as Feature['priority'] }
                    return (
                      <div key={p.id} className={`phase ${p.is_completed ? 'done' : i === 0 ? 'active' : 'next'}`}>
                        <span className="p-dot">{p.is_completed ? <DI.Check/> : String(i + 1).padStart(2, '0')}</span>
                        <div className="p-body">
                          <div className="p-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>{p.name}</span>
                            <button
                              type="button"
                              className="btn-sm ghost"
                              onClick={() => void togglePhaseComplete(p)}
                            >
                              {p.is_completed ? 'Reopen phase' : 'Mark phase complete'}
                            </button>
                          </div>
                          {p.description ? <div className="p-desc">{p.description}</div> : null}
                          <div className="p-meta">
                            <span>
                              <b>{featuresByPhase[p.id]?.done ?? 0}</b>/{featuresByPhase[p.id]?.total ?? 0} features complete
                            </span>
                          </div>
                          {phaseFeatures.length > 0 ? (
                            <div className="feat-list" style={{ marginTop: 10 }}>
                              {phaseFeatures.map(f => (
                                <div
                                  key={f.id}
                                  className={`feat-item ${f.is_completed ? 'done' : ''}`}
                                  role="button"
                                  tabIndex={0}
                                  onClick={() => void toggleFeature(f)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                      e.preventDefault()
                                      void toggleFeature(f)
                                    }
                                  }}
                                >
                                  <span className="ck">{f.is_completed && <DI.Check/>}</span>
                                  <span className={`prio ${f.priority}`}>{priorityShort(f.priority)}</span>
                                  <span className="label">{f.title}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ color: 'var(--fg-3)', fontSize: 13, margin: '8px 0 0' }}>No features in this phase yet.</p>
                          )}
                          <div style={{ display: 'grid', gap: 8, marginTop: 10 }}>
                            <input
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
                              placeholder="Feature title"
                              value={draft.title}
                              onChange={e =>
                                setFeatureDraftByPhase(prev => ({
                                  ...prev,
                                  [p.id]: { ...draft, title: e.target.value },
                                }))
                              }
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault()
                                  void addFeatureToPhase(p.id)
                                }
                              }}
                            />
                            <textarea
                              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', resize: 'vertical' }}
                              placeholder="Optional details"
                              rows={2}
                              value={draft.description}
                              onChange={e =>
                                setFeatureDraftByPhase(prev => ({
                                  ...prev,
                                  [p.id]: { ...draft, description: e.target.value },
                                }))
                              }
                            />
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <select
                                className="dash-select"
                                value={draft.priority}
                                onChange={e =>
                                  setFeatureDraftByPhase(prev => ({
                                    ...prev,
                                    [p.id]: { ...draft, priority: e.target.value as Feature['priority'] },
                                  }))
                                }
                              >
                                <option value="high">high</option>
                                <option value="medium">medium</option>
                                <option value="low">low</option>
                              </select>
                              <button
                                type="button"
                                className="btn-sm ghost"
                                onClick={() => void addFeatureToPhase(p.id)}
                                disabled={busyAction === `feature:${p.id}` || !draft.title.trim()}
                              >
                                {busyAction === `feature:${p.id}` ? 'Adding…' : 'Add feature'}
                              </button>
                            </div>
                          </div>
                          {unscopedFeatures.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <div className="eyebrow-mono" style={{ marginBottom: 6 }}>Attach from Feature scope</div>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {unscopedFeatures.slice(0, 8).map(f => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    className="btn-sm ghost"
                                    disabled={busyAction === `attach:${f.id}`}
                                    onClick={() => {
                                      void (async () => {
                                        try {
                                          setBusyAction(`attach:${f.id}`)
                                          const updated = await FeatureAPI.updateFeature(f.id, { phase_id: p.id })
                                          setFeatures(prev => prev.map(x => (x.id === f.id ? updated : x)))
                                          showSuccess(`Attached “${f.title}” to ${p.name}.`)
                                        } catch (err) {
                                          showError(err instanceof Error ? err.message : 'Failed to attach feature')
                                        } finally {
                                          setBusyAction(null)
                                        }
                                      })()
                                    }}
                                  >
                                    + {f.title}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {tab === 'intelligence' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Intelligence</h3></div>
              <div className="dash-card idea-intel-launcher">
                <div className="idea-intel-launcher-head">
                  <div>
                    <div className="eyebrow-mono">Unified intelligence workspace</div>
                    <p className="idea-intel-launcher-desc">
                      One flow for this idea: discover competitors → analyze → feature matrix → position map → gap analysis → opportunities → strategic insights.
                    </p>
                  </div>
                  <button type="button" className="btn-sm solid" onClick={() => router.push(routes.intelligenceForIdea(ideaId))}>
                    <DI.Radar /> Open intelligence workspace
                  </button>
                </div>
                <div className="idea-intel-launcher-stats">
                  <div className="idea-intel-stat">
                    <span className="idea-intel-stat-value">{competitors.length}</span>
                    <span className="idea-intel-stat-label">Competitors tracked</span>
                  </div>
                  <div className="idea-intel-stat">
                    <span className="idea-intel-stat-value">{gaps.length}</span>
                    <span className="idea-intel-stat-label">Opportunities found</span>
                  </div>
                  <div className="idea-intel-stat">
                    <span className="idea-intel-stat-value">{marketGapDone || gaps.length > 0 ? 'Yes' : '—'}</span>
                    <span className="idea-intel-stat-label">Gap analysis run</span>
                  </div>
                </div>
                {(competitorPreview.length > 0 || gapPreview.length > 0) && (
                  <div className="idea-intel-preview-grid">
                    {competitorPreview.length > 0 && (
                      <div className="idea-intel-preview">
                        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Competitors</div>
                        <ul className="idea-intel-preview-list">
                          {competitorPreview.map(c => (
                            <li key={c.id}>
                              <span className="idea-intel-preview-name">{c.name}</span>
                              {c.position && <span className="idea-intel-preview-meta">{c.position}</span>}
                            </li>
                          ))}
                        </ul>
                        {competitors.length > competitorPreview.length && (
                          <p className="idea-intel-preview-more">+{competitors.length - competitorPreview.length} more in workspace</p>
                        )}
                      </div>
                    )}
                    {gapPreview.length > 0 && (
                      <div className="idea-intel-preview">
                        <div className="eyebrow-mono" style={{ marginBottom: 8 }}>Gaps & opportunities</div>
                        <ul className="idea-intel-preview-list">
                          {gapPreview.map((g, i) => (
                            <li key={`${g.title || 'gap'}-${i}`}>
                              <span className="idea-intel-preview-name">{g.title || 'Opportunity'}</span>
                              {g.description ? (
                                <span className="idea-intel-preview-meta">
                                  {g.description.length > 90 ? `${g.description.slice(0, 90)}…` : g.description}
                                </span>
                              ) : null}
                            </li>
                          ))}
                        </ul>
                        {gaps.length > gapPreview.length && (
                          <p className="idea-intel-preview-more">+{gaps.length - gapPreview.length} more in workspace</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
                {competitorPreview.length === 0 && gapPreview.length === 0 && (
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--fg-3)', lineHeight: 1.5 }}>
                    No competitor or gap data yet. Discover competitors or run gap analysis to populate this summary.
                  </p>
                )}
                <div className="idea-intel-launcher-actions">
                  <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.intelligenceDiscover(ideaId))}>
                    <DI.Radar /> Discover competitors
                  </button>
                  <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.intelligenceGapAnalysis(ideaId))}>
                    <DI.Target /> Run gap analysis
                  </button>
                  <button type="button" className="btn-sm ghost" onClick={() => router.push(`${routes.intelligenceForIdea(ideaId)}#intel-strategic`)}>
                    <DI.Sparkles /> Strategic insights
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'copilot' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Copilot</h3></div>
              <div className="cp-suggestions" style={{ padding: 0 }}>
                {copilotPrompts.map(prompt => (
                  <button key={prompt} type="button" className="cp-sugg" onClick={() => setCopilotInput(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
              <div className="cp-stream" style={{ maxHeight: 360, border: '1px solid var(--line)', borderRadius: 10 }}>
                {copilotMessages.length === 0 && busyAction !== 'copilot' ? (
                  <p style={{ color: 'var(--fg-2)' }}>No messages yet. Use a prompt above or ask directly.</p>
                ) : (
                  copilotMessages.map((m, idx) => (
                    <div key={idx} className={`cp-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                      <div className="av" />
                      <div>
                        <div className="cp-bubble" style={m.role === 'user' ? { whiteSpace: 'pre-wrap' } : undefined}>
                          {m.role === 'user' ? m.text : <MarkdownMessage content={m.text} />}
                        </div>
                        {m.failed && (
                          <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: 12.5, color: 'var(--warn)' }}>Message failed to send.</span>
                            <button
                              type="button"
                              className="btn-sm ghost"
                              onClick={handleCopilotRetry}
                              disabled={busyAction === 'copilot'}
                            >
                              Retry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {busyAction === 'copilot' && (
                  <div className="cp-msg ai">
                    <div className="av" />
                    <div className="cp-bubble">Thinking…</div>
                  </div>
                )}
              </div>
              <div className="cp-input-wrap" style={{ padding: 0, borderTop: 0 }}>
                <div className="cp-input">
                  <textarea
                    value={copilotInput}
                    onChange={e => setCopilotInput(e.target.value)}
                    rows={1}
                    placeholder={`Ask about ${idea.title}...`}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void sendCopilot()
                      }
                    }}
                  />
                  <button type="button" className="cp-send" onClick={() => void sendCopilot()} disabled={busyAction === 'copilot' || !copilotInput.trim()}>
                    <DI.Send />
                  </button>
                </div>
              </div>
            </div>
          )}

          {tab === 'attachments' && (
            <div className="id-panel">
              <div className="id-panel-head"><h3>Attachments</h3></div>
              <div className="dash-card" style={{ padding: 12 }}>
                <div className="eyebrow-mono" style={{ marginBottom: 10 }}>Upload file</div>
                <input
                  type="file"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void uploadAttachment(file)
                    e.target.value = ''
                  }}
                  disabled={busyAction === 'upload'}
                />
                <p style={{ color: 'var(--fg-3)', fontSize: 12, marginTop: 8 }}>Images, PDF, Office docs, text — max 20 MB.</p>
              </div>
              {attachments.length === 0 ? (
                <p style={{ color: 'var(--fg-2)' }}>No attachments yet.</p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {attachments.map(a => (
                    <div key={a.id} className="dash-card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontSize: 14 }}>{a.file_name}</div>
                        {a.file_size != null && (
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>
                            {Math.round(a.file_size / 1024)} KB
                          </div>
                        )}
                      </div>
                      {a.signed_url && (
                        <a href={a.signed_url} target="_blank" rel="noreferrer" className="btn-sm ghost">
                          <DI.Export /> Open
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {tab === 'discussion' && (
            <div className="id-panel">
              <CommentsSection ideaId={ideaId} currentUserId={currentUserId} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
