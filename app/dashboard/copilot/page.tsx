'use client'
import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import IdeaDraftPanel from '@/components/copilot/IdeaDraftPanel'
import { CopilotAPI, type ChatHistoryItem } from '@/lib/api/copilot'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import {
  buildDraftContextMessage,
  clearIdeaDraft,
  EMPTY_IDEA_DRAFT,
  hasDraftContent,
  loadIdeaDraft,
  saveIdeaDraft,
  type IdeaDraft,
} from '@/lib/copilot/idea-draft'
import {
  applyCopilotListToIdea,
  buildQuickReportPrompt,
  buildTieredChipGroups,
  detectExtractableList,
  fetchIdeaCopilotContext,
  parseReportSections,
  QUICK_REPORTS,
  quickReportTitle,
  workspaceSuggestionChips,
  type ExtractableList,
  type IdeaCopilotContext,
  type QuickReportId,
  type ReportSection,
} from '@/lib/copilot/opinionated-copilot'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

type Message = {
  id: string
  role: 'user' | 'ai'
  content: string
  display?: string
  kind?: 'chat' | 'report'
  reportTitle?: string
  reportSections?: ReportSection[]
  extractableList?: ExtractableList | null
  ideaId?: string
  appliedToIdea?: boolean
  failed?: boolean
  retryQuery?: string
  retryOptions?: { reportId?: QuickReportId }
}

export default function CopilotPage() {
  return (
    <Suspense fallback={<div className="page"><PageLoading label="Loading Copilot…" /></div>}>
      <CopilotPageInner />
    </Suspense>
  )
}

function CopilotPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | undefined>()
  const [ideaContext, setIdeaContext] = useState<IdeaCopilotContext | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [ideaDraft, setIdeaDraft] = useState<IdeaDraft | null>(null)
  const [showDraftPanel, setShowDraftPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [runningReport, setRunningReport] = useState<QuickReportId | null>(null)
  const [applyingListId, setApplyingListId] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<HTMLDivElement>(null)

  const loadInitial = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [hist, ideaResult] = await Promise.all([
        CopilotAPI.getHistory(30, 0),
        IdeaAPI.getIdeas({ limit: 20, sort_by: 'updated_at', sort_order: 'desc' }),
      ])
      setHistory(hist.logs)
      setIdeas(ideaResult.ideas)
      const ideaParam = searchParams.get('idea')
      if (ideaParam) {
        setSelectedIdeaId(ideaParam)
      } else {
        setSelectedIdeaId(undefined)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Copilot')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  useEffect(() => {
    loadInitial()
  }, [loadInitial])

  useEffect(() => {
    const ideaParam = searchParams.get('idea')
    if (ideaParam) setSelectedIdeaId(ideaParam)
    const promptParam = searchParams.get('prompt')
    if (promptParam) setDraft(promptParam)
    if (searchParams.get('draft') === '1') {
      const stored = loadIdeaDraft()
      if (stored) {
        setIdeaDraft(stored)
        setShowDraftPanel(true)
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!selectedIdeaId) {
      setIdeaContext(null)
      return
    }
    let cancelled = false
    setContextLoading(true)
    fetchIdeaCopilotContext(selectedIdeaId)
      .then(ctx => {
        if (!cancelled) setIdeaContext(ctx)
      })
      .catch(() => {
        if (!cancelled) setIdeaContext(null)
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [selectedIdeaId])

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, runningReport])

  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(null), 3500)
    return () => window.clearTimeout(t)
  }, [toast])

  function loadConversation(item: ChatHistoryItem) {
    setActiveId(item.id)
    const aiContent = item.ai_response
    setMessages([
      { id: `u-${item.id}`, role: 'user', content: item.user_prompt, display: item.user_prompt },
      {
        id: `a-${item.id}`,
        role: 'ai',
        content: aiContent,
        kind: 'chat',
        extractableList: item.idea_id ? detectExtractableList(aiContent) : null,
        ideaId: item.idea_id,
      },
    ])
    if (item.idea_id) setSelectedIdeaId(item.idea_id)
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setDraft('')
  }

  function openNewIdeaDraft() {
    const next = { ...EMPTY_IDEA_DRAFT, source: 'copilot' as const }
    setIdeaDraft(next)
    setShowDraftPanel(true)
    saveIdeaDraft(next)
    router.replace(routes.copilotWithDraft)
  }

  function dismissDraft() {
    setShowDraftPanel(false)
    clearIdeaDraft()
    router.replace(routes.copilot)
  }

  function updateDraft(next: IdeaDraft) {
    setIdeaDraft(next)
    saveIdeaDraft(next)
  }

  async function refreshHistory() {
    const hist = await CopilotAPI.getHistory(30, 0)
    setHistory(hist.logs)
  }

  async function sendMessage(text?: string, options?: { reportId?: QuickReportId }) {
    const query = (text ?? draft).trim()
    if (!query || sending) return

    const payload = ideaDraft && hasDraftContent(ideaDraft)
      ? buildDraftContextMessage(ideaDraft, query)
      : query

    if (!text) setDraft('')
    setSending(true)
    setError(null)

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: payload,
      display: options?.reportId ? quickReportTitle(options.reportId) : query,
      kind: options?.reportId ? 'report' : 'chat',
      reportTitle: options?.reportId ? quickReportTitle(options.reportId) : undefined,
      retryQuery: query,
      retryOptions: options,
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await CopilotAPI.chat({
        query: payload,
        idea_id: selectedIdeaId,
      })
      const aiContent = response.response
      const isReport = Boolean(options?.reportId)
      const aiMsg: Message = {
        id: `a-${Date.now()}`,
        role: 'ai',
        content: aiContent,
        kind: isReport ? 'report' : 'chat',
        reportTitle: isReport ? quickReportTitle(options!.reportId!) : undefined,
        reportSections: isReport ? parseReportSections(aiContent) : undefined,
        extractableList: !isReport && selectedIdeaId ? detectExtractableList(aiContent) : null,
        ideaId: selectedIdeaId,
      }
      setMessages(prev => [...prev, aiMsg])
      await refreshHistory()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copilot request failed')
      setMessages(prev => prev.map(m => (m.id === userMsg.id ? { ...m, failed: true } : m)))
    } finally {
      setSending(false)
    }
  }

  function retryMessage(m: Message) {
    if (!m.retryQuery || sending) return
    setMessages(prev => prev.filter(msg => msg.id !== m.id))
    void sendMessage(m.retryQuery, m.retryOptions)
  }

  async function runQuickReport(reportId: QuickReportId) {
    if (!selectedIdeaId || !ideaContext || sending || runningReport) return
    setRunningReport(reportId)
    setError(null)
    try {
      const prompt = buildQuickReportPrompt(reportId, ideaContext)
      await sendMessage(prompt, { reportId })
    } finally {
      setRunningReport(null)
    }
  }

  async function addListToIdea(message: Message) {
    if (!message.ideaId || !message.extractableList || message.appliedToIdea) return
    try {
      setApplyingListId(message.id)
      setError(null)
      const result = await applyCopilotListToIdea(
        message.ideaId,
        message.extractableList,
        message.content,
      )
      setMessages(prev =>
        prev.map(m => (m.id === message.id ? { ...m, appliedToIdea: true } : m)),
      )
      setToast(`Added ${result.created} ${result.itemType}${result.created === 1 ? '' : 's'} to your idea.`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add items to idea')
    } finally {
      setApplyingListId(null)
    }
  }

  const contextIdea = ideas.find(i => i.id === selectedIdeaId)
  const chipGroups = ideaContext
    ? buildTieredChipGroups(ideaContext.signals)
    : []
  const workspaceChips = workspaceSuggestionChips()
  const ideaTitle = contextIdea?.title ?? ideaContext?.idea.title

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">AI Copilot · {contextIdea ? contextIdea.title : ideaDraft?.title || 'workspace'}</div>
          <h1>Your AI product <em>strategist</em>, on tap.</h1>
          <div className="ph-sub">
            {showDraftPanel && ideaDraft
              ? 'Draft fields below are sent with each message when enabled.'
              : selectedIdeaId && ideaContext
                ? `Opinionated for ${ideaContext.readinessPercent}% Startup Readiness — suggestions match your next step.`
                : 'Connected to your ideas and competitor data on the backend.'}
          </div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm ghost" onClick={openNewIdeaDraft}>
            <DI.Plus/> New idea draft
          </button>
          <button type="button" className="btn-sm ghost" onClick={newChat}><DI.Plus/> New chat</button>
        </div>
      </div>

      {toast && (
        <div className="dash-toast" role="status">{toast}</div>
      )}

      {error && !loading && <PageError message={error} onRetry={loadInitial} />}

      {loading && !error && <PageLoading label="Loading Copilot…" />}

      {!loading && !error && showDraftPanel && ideaDraft && (
        <IdeaDraftPanel draft={ideaDraft} onChange={updateDraft} onDismiss={dismissDraft} />
      )}

      {!loading && !error && (
      <div className="copilot-page">
        <div className="cp-history">
          <div className="ch-head">Conversations</div>
          {history.length === 0 ? (
            <p style={{ padding: 12, fontSize: 13, color: 'var(--fg-2)' }}>No history yet.</p>
          ) : history.map(h => (
            <button
              key={h.id}
              type="button"
              className={`ch-item ${activeId === h.id ? 'active' : ''}`}
              onClick={() => loadConversation(h)}
            >
              <span className="ch-title">{h.user_prompt}</span>
              <span className="ch-when">{timeAgo(h.created_at)}</span>
            </button>
          ))}
        </div>

        <div className="cp-main">
          <div className="cp-head">
            <div className="ai-orb"/>
            <div className="cp-title">
              <span className="t1">{contextIdea?.title ?? ideaDraft?.title ?? 'Workspace Copilot'}</span>
              <span className="t2">
                {ideaDraft && hasDraftContent(ideaDraft)
                  ? 'Idea draft attached'
                  : ideaContext
                    ? `${ideaContext.readinessPercent}% readiness · product manager mode`
                    : contextIdea
                      ? 'Loading idea context…'
                      : 'Workspace · all ideas'}
              </span>
            </div>
            {ideas.length > 0 && (
              <select
                value={selectedIdeaId ?? ''}
                onChange={e => setSelectedIdeaId(e.target.value || undefined)}
                style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
              >
                <option value="">All ideas (workspace)</option>
                {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            )}
          </div>

          <div className="cp-stream" ref={streamRef}>
            {messages.length === 0 && !sending && (
              <div className="cp-msg ai">
                <div className="av"/>
                <div className="cp-bubble">
                  {selectedIdeaId
                    ? 'Pick a suggestion below or run a Quick Report — I’ll tailor answers to where this idea is in your readiness journey.'
                    : 'Select an idea to unlock stage-aware suggestions and Quick Reports.'}
                  {showDraftPanel ? ' Enabled draft fields are included in each message.' : ''}
                </div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`cp-msg ${m.role === 'user' ? 'user' : 'ai'}${m.kind === 'report' ? ' cp-msg--report' : ''}`}>
                <div className="av"/>
                <div className="cp-msg-body">
                  {m.role === 'ai' && m.kind === 'report' && m.reportSections && m.reportSections.length > 0 ? (
                    <div className="cp-report-card">
                      <div className="cp-report-head">
                        <span className="cp-report-badge">Quick Report</span>
                        <h3>{m.reportTitle ?? 'Report'}</h3>
                      </div>
                      <div className="cp-report-body">
                        {m.reportSections.map(section => (
                          <div key={section.title} className="cp-report-section">
                            <div className="cp-report-section-title">{section.title}</div>
                            <ul className="cp-report-list">
                              {section.items.map((item, idx) => (
                                <li key={`${section.title}-${idx}`}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : m.role === 'ai' && m.kind === 'report' ? (
                    <div className="cp-report-card cp-report-card--fallback">
                      <div className="cp-report-head">
                        <span className="cp-report-badge">Quick Report</span>
                        <h3>{m.reportTitle ?? 'Report'}</h3>
                      </div>
                      <div className="cp-report-fallback" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
                    </div>
                  ) : (
                    <div className="cp-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                      {m.role === 'user' && m.display ? m.display : m.content}
                    </div>
                  )}
                  {m.role === 'user' && m.failed && (
                    <div className="cp-msg-failed" style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12.5, color: 'var(--warn)' }}>Message failed to send.</span>
                      <button
                        type="button"
                        className="cp-add-to-idea"
                        onClick={() => retryMessage(m)}
                        disabled={sending}
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  {m.role === 'ai' && m.extractableList && m.ideaId && m.kind !== 'report' && (
                    <button
                      type="button"
                      className="cp-add-to-idea"
                      onClick={() => addListToIdea(m)}
                      disabled={Boolean(m.appliedToIdea) || applyingListId === m.id}
                    >
                      {m.appliedToIdea
                        ? `Added to ${ideaTitle ?? 'idea'}`
                        : applyingListId === m.id
                          ? 'Adding…'
                          : `Add these to ${ideaTitle ?? 'idea'}`}
                    </button>
                  )}
                </div>
              </div>
            ))}
            {sending && (
              <div className="cp-msg ai">
                <div className="av"/>
                <div className="cp-bubble">Thinking…</div>
              </div>
            )}
          </div>

          <div className="cp-suggestions">
            {selectedIdeaId ? (
              contextLoading && chipGroups.length === 0 ? (
                <p className="cp-sugg-hint">Loading readiness-aware suggestions…</p>
              ) : chipGroups.length > 0 ? (
                chipGroups.map(group => (
                  <div key={group.stage} className="cp-sugg-group">
                    <span className="cp-sugg-stage">{group.stage}</span>
                    <div className="cp-sugg-row">
                      {group.chips.map(chip => (
                        <button
                          key={chip}
                          type="button"
                          className="cp-sugg"
                          onClick={() => sendMessage(chip)}
                          disabled={sending}
                        >
                          {chip}
                        </button>
                      ))}
                    </div>
                  </div>
                ))
              ) : (
                <p className="cp-sugg-hint">This idea is fully ready — use Quick Reports or ask anything.</p>
              )
            ) : (
              <div className="cp-sugg-group">
                <span className="cp-sugg-stage">Workspace</span>
                <div className="cp-sugg-row">
                  {workspaceChips.map(chip => (
                    <button
                      key={chip}
                      type="button"
                      className="cp-sugg"
                      onClick={() => setDraft(chip)}
                      disabled={sending}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {selectedIdeaId && (
            <div className="cp-quick-reports">
              <div className="cp-quick-reports-label">Quick Reports</div>
              <div className="cp-quick-reports-row">
                {QUICK_REPORTS.map(report => (
                  <button
                    key={report.id}
                    type="button"
                    className="cp-quick-report-btn"
                    onClick={() => runQuickReport(report.id)}
                    disabled={!ideaContext || sending || Boolean(runningReport)}
                    title={report.label}
                  >
                    {runningReport === report.id ? 'Generating…' : report.label}
                  </button>
                ))}
              </div>
              {!ideaContext && !contextLoading && (
                <p className="cp-quick-reports-hint">Could not load idea context for reports.</p>
              )}
            </div>
          )}

          <div className="cp-input-wrap">
            <div className="cp-input">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    sendMessage()
                  }
                }}
                placeholder={
                  ideaDraft && hasDraftContent(ideaDraft)
                    ? 'Add a prompt — draft context is attached automatically…'
                    : selectedIdeaId
                      ? 'Ask your product strategist anything…'
                      : 'Ask the Copilot anything about your ideas, market or roadmap…'
                }
                rows={1}
                disabled={sending}
              />
              <div className="cp-input-tools">
                <button type="button" className="cp-send" title="Send" onClick={() => sendMessage()} disabled={sending || !draft.trim()}>
                  <DI.Send/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
