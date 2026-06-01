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
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { timeAgo } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const GENERIC_SUGGESTIONS = [
  'Generate MVP plan',
  'Find market gaps',
  'Improve my roadmap',
  'Analyze competitors',
  'Validate my idea',
]

type Message = { id: string; role: 'user' | 'ai'; content: string; display?: string }

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
  const [ideaDraft, setIdeaDraft] = useState<IdeaDraft | null>(null)
  const [showDraftPanel, setShowDraftPanel] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
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
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  function loadConversation(item: ChatHistoryItem) {
    setActiveId(item.id)
    setMessages([
      { id: `u-${item.id}`, role: 'user', content: item.user_prompt, display: item.user_prompt },
      { id: `a-${item.id}`, role: 'ai', content: item.ai_response },
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

  async function sendMessage(text?: string) {
    const query = (text ?? draft).trim()
    if (!query || sending) return

    const payload = ideaDraft && hasDraftContent(ideaDraft)
      ? buildDraftContextMessage(ideaDraft, query)
      : query

    setDraft('')
    setSending(true)
    setError(null)
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: payload,
      display: query,
    }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await CopilotAPI.chat({
        query: payload,
        idea_id: selectedIdeaId,
      })
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: 'ai', content: response.response }])
      const hist = await CopilotAPI.getHistory(30, 0)
      setHistory(hist.logs)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Copilot request failed')
    } finally {
      setSending(false)
    }
  }

  const contextIdea = ideas.find(i => i.id === selectedIdeaId)
  const cpSuggestions = contextIdea
    ? [
        `Generate features for ${contextIdea.title}`,
        `Who are the competitors of ${contextIdea.title}`,
        `What is the market gap for ${contextIdea.title}`,
        `Create a go-to-market plan for ${contextIdea.title}`,
      ]
    : GENERIC_SUGGESTIONS

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">AI Copilot · {contextIdea ? contextIdea.title : ideaDraft?.title || 'workspace'}</div>
          <h1>Your AI product <em>strategist</em>, on tap.</h1>
          <div className="ph-sub">
            {showDraftPanel && ideaDraft
              ? 'Draft fields below are sent with each message when enabled.'
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
                  : contextIdea
                    ? 'Idea context'
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
                  Ask anything about your ideas, competitors, or roadmap.
                  {showDraftPanel ? ' Enabled draft fields are included in each message.' : ''}
                </div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`cp-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                <div className="av"/>
                <div className="cp-bubble" style={{ whiteSpace: 'pre-wrap' }}>
                  {m.role === 'user' && m.display ? m.display : m.content}
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
            {cpSuggestions.map(s => (
              <button key={s} type="button" className="cp-sugg" onClick={() => setDraft(s)} disabled={sending}>{s}</button>
            ))}
          </div>

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
