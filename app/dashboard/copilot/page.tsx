'use client'
import { useEffect, useRef, useState } from 'react'
import { CopilotAPI, type ChatHistoryItem } from '@/lib/api/copilot'
import { IdeaAPI, type Idea } from '@/lib/api/idea'
import { timeAgo } from '@/lib/dashboard/format'
import * as DI from '@/components/dashboard/Icons'

const CP_SUGGESTIONS = ['Score my top idea', 'Suggest MVP features', 'Find market gaps', 'Draft a 4-week beta plan', 'Compare competitors']

type Message = { id: string; role: 'user' | 'ai'; content: string }

export default function CopilotPage() {
  const [history, setHistory] = useState<ChatHistoryItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [draft, setDraft] = useState('')
  const [ideas, setIdeas] = useState<Idea[]>([])
  const [selectedIdeaId, setSelectedIdeaId] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const streamRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadInitial()
  }, [])

  useEffect(() => {
    streamRef.current?.scrollTo({ top: streamRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending])

  async function loadInitial() {
    try {
      setLoading(true)
      const [hist, ideaResult] = await Promise.all([
        CopilotAPI.getHistory(30, 0),
        IdeaAPI.getIdeas({ limit: 20, sort_by: 'updated_at', sort_order: 'desc' }),
      ])
      setHistory(hist.logs)
      setIdeas(ideaResult.ideas)
      if (ideaResult.ideas[0]) setSelectedIdeaId(ideaResult.ideas[0].id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Copilot')
    } finally {
      setLoading(false)
    }
  }

  function loadConversation(item: ChatHistoryItem) {
    setActiveId(item.id)
    setMessages([
      { id: `u-${item.id}`, role: 'user', content: item.user_prompt },
      { id: `a-${item.id}`, role: 'ai', content: item.ai_response },
    ])
    if (item.idea_id) setSelectedIdeaId(item.idea_id)
  }

  function newChat() {
    setActiveId(null)
    setMessages([])
    setDraft('')
  }

  async function sendMessage(text?: string) {
    const query = (text ?? draft).trim()
    if (!query || sending) return

    setDraft('')
    setSending(true)
    setError(null)
    const userMsg: Message = { id: `u-${Date.now()}`, role: 'user', content: query }
    setMessages(prev => [...prev, userMsg])

    try {
      const response = await CopilotAPI.chat({
        query,
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

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">AI Copilot · {contextIdea ? contextIdea.title : 'workspace'}</div>
          <h1>Your AI product <em>strategist</em>, on tap.</h1>
          <div className="ph-sub">Connected to your ideas and competitor data on the backend.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost" onClick={newChat}><DI.Plus/> New chat</button>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 12, color: 'var(--warn)' }}>{error}</div>}

      <div className="copilot-page">
        <div className="cp-history">
          <div className="ch-head">Conversations</div>
          {loading ? (
            <p style={{ padding: 12, fontSize: 13, color: 'var(--fg-2)' }}>Loading…</p>
          ) : history.length === 0 ? (
            <p style={{ padding: 12, fontSize: 13, color: 'var(--fg-2)' }}>No history yet.</p>
          ) : history.map(h => (
            <button
              key={h.id}
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
              <span className="t1">{contextIdea?.title ?? 'Workspace Copilot'}</span>
              <span className="t2">Workspace context{contextIdea ? '' : ' · all ideas'}</span>
            </div>
            {ideas.length > 0 && (
              <select
                value={selectedIdeaId ?? ''}
                onChange={e => setSelectedIdeaId(e.target.value || undefined)}
                style={{ marginLeft: 'auto', fontSize: 12, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)' }}
              >
                {ideas.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            )}
          </div>

          <div className="cp-stream" ref={streamRef}>
            {messages.length === 0 && !sending && (
              <div className="cp-msg ai">
                <div className="av"/>
                <div className="cp-bubble">Ask anything about your ideas, competitors, or roadmap. I&apos;m connected to your live workspace.</div>
              </div>
            )}
            {messages.map(m => (
              <div key={m.id} className={`cp-msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                <div className="av"/>
                <div className="cp-bubble" style={{ whiteSpace: 'pre-wrap' }}>{m.content}</div>
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
            {CP_SUGGESTIONS.map(s => (
              <button key={s} className="cp-sugg" onClick={() => sendMessage(s)} disabled={sending}>{s}</button>
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
                placeholder="Ask the Copilot anything about your ideas, market or roadmap…"
                rows={1}
                disabled={sending}
              />
              <div className="cp-input-tools">
                <button className="cp-send" title="Send" onClick={() => sendMessage()} disabled={sending || !draft.trim()}>
                  <DI.Send/>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
