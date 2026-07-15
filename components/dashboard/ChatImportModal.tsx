'use client'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChatImportAPI, type ChatSource, type ChatImportResult } from '@/lib/api/chat-import'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'
import { useRouter } from 'next/navigation'

interface Props {
  onClose: () => void
  onDone?: (result: ChatImportResult) => void
}

const SOURCES: { id: ChatSource; label: string; hint: string }[] = [
  { id: 'chatgpt', label: 'ChatGPT', hint: 'Export chat as JSON from chatgpt.com/settings or paste text' },
  { id: 'claude', label: 'Claude', hint: 'Copy & paste the conversation text' },
  { id: 'gemini', label: 'Gemini', hint: 'Copy & paste the conversation text' },
  { id: 'other', label: 'Other AI', hint: 'Paste any AI conversation text' },
]

const SOURCE_ICONS: Record<ChatSource, string> = {
  chatgpt: '🤖',
  claude: '🧠',
  gemini: '✨',
  other: '💬',
}

type Step = 'source' | 'content' | 'importing' | 'done'

export function ChatImportModal({ onClose, onDone }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('source')
  const [source, setSource] = useState<ChatSource>('chatgpt')
  const [mode, setMode] = useState<'text' | 'file'>('text')
  const [rawText, setRawText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ChatImportResult | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function runImport() {
    if (mode === 'text' && rawText.trim().length < 10) {
      setError('Please paste at least a few lines of conversation text.')
      return
    }
    if (mode === 'file' && !file) {
      setError('Please select a file to import.')
      return
    }
    setStep('importing')
    setError(null)
    try {
      const res = mode === 'file' && file
        ? await ChatImportAPI.importFile(source, file)
        : await ChatImportAPI.importText(source, rawText)
      setResult(res)
      setStep('done')
      onDone?.(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Try again.')
      setStep('content')
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
      <div className="modal-box" style={{ maxWidth: 520, background: 'var(--surface)' }}>
        <div className="modal-head">
          <div>
            <div className="eyebrow-mono" style={{ marginBottom: 4 }}>
              Import from AI chat
              {step !== 'source' && step !== 'importing' && (
                <span style={{ marginLeft: 8, color: 'var(--fg-3)' }}>· {SOURCE_ICONS[source]} {SOURCES.find(s => s.id === source)?.label}</span>
              )}
            </div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em' }}>
              {step === 'source' && 'Which AI assistant?'}
              {step === 'content' && 'Paste your conversation'}
              {step === 'importing' && 'Extracting ideas…'}
              {step === 'done' && 'Import complete!'}
            </h3>
          </div>
          <button type="button" className="modal-close" onClick={onClose}><DI.X /></button>
        </div>

        <div className="modal-body">
          {/* Step 1 — pick source */}
          {step === 'source' && (
            <div>
              <p style={{ color: 'var(--fg-2)', fontSize: 14, marginBottom: 16 }}>
                Paste your conversation from any AI assistant. We&apos;ll extract startup ideas, phases, and features automatically.
              </p>
              <div className="chat-source-grid">
                {SOURCES.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    className={`chat-source-card ${source === s.id ? 'active' : ''}`}
                    onClick={() => setSource(s.id)}
                  >
                    <span className="chat-source-icon">{SOURCE_ICONS[s.id]}</span>
                    <span className="chat-source-label">{s.label}</span>
                    <span className="chat-source-hint">{s.hint}</span>
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
                <button type="button" className="btn-sm solid" onClick={() => setStep('content')}>
                  Continue <DI.ArrowRight />
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — content */}
          {step === 'content' && (
            <div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
                <button
                  type="button"
                  className={`chip ${mode === 'text' ? 'on' : ''}`}
                  onClick={() => setMode('text')}
                >
                  Paste text
                </button>
                <button
                  type="button"
                  className={`chip ${mode === 'file' ? 'on' : ''}`}
                  onClick={() => setMode('file')}
                >
                  Upload file
                </button>
              </div>

              {mode === 'text' ? (
                <textarea
                  value={rawText}
                  onChange={e => setRawText(e.target.value)}
                  rows={10}
                  placeholder="Paste your AI conversation here…"
                  style={{ ...inp, width: '100%', resize: 'vertical', lineHeight: 1.5 }}
                  autoFocus
                />
              ) : (
                <div
                  className="file-drop-zone"
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const f = e.dataTransfer.files?.[0]
                    if (f) setFile(f)
                  }}
                >
                  <DI.Doc />
                  <p>{file ? file.name : 'Drop a .json or .txt file, or click to browse'}</p>
                  {file && <span style={{ fontSize: 12, color: 'var(--fg-3)' }}>{Math.round(file.size / 1024)} KB</span>}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".json,.txt,.md"
                    style={{ display: 'none' }}
                    onChange={e => setFile(e.target.files?.[0] ?? null)}
                  />
                </div>
              )}

              {error && <p style={{ color: 'var(--bad)', fontSize: 13, marginTop: 8 }}>{error}</p>}

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button type="button" className="btn-sm ghost" onClick={() => setStep('source')}>
                  ← Back
                </button>
                <button
                  type="button"
                  className="btn-sm solid"
                  onClick={() => void runImport()}
                  disabled={mode === 'text' ? rawText.trim().length < 10 : !file}
                >
                  <DI.Sparkles /> Extract Ideas
                </button>
              </div>
            </div>
          )}

          {/* Step 3 — importing */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '32px 0' }}>
              <div className="spin-ring" style={{ margin: '0 auto 20px' }} />
              <p style={{ color: 'var(--fg-2)', fontSize: 14 }}>
                Reading your conversation and extracting ideas with Gemini…
              </p>
            </div>
          )}

          {/* Step 4 — done */}
          {step === 'done' && result && (
            <div>
              <div className="chat-import-result">
                <div className="chat-result-icon">✅</div>
                <p style={{ color: 'var(--fg)', fontWeight: 500, fontSize: 16 }}>
                  Import complete!
                </p>
                <p style={{ color: 'var(--fg-2)', fontSize: 14, marginTop: 4, marginBottom: 20 }}>
                  {result.processed_summary ?? `Extracted ${result.ideas_extracted} idea${result.ideas_extracted !== 1 ? 's' : ''} from your conversation.`}
                </p>
                <div className="chat-result-stats">
                  {[
                    ['Ideas', result.ideas_extracted],
                    ['Phases', result.phases_extracted],
                    ['Features', result.features_extracted],
                    ['Suggestions', result.suggestions_extracted],
                  ].map(([label, count]) => (
                    <div key={String(label)} className="result-stat">
                      <span className="rs-num">{String(count)}</span>
                      <span className="rs-label">{String(label)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
                <button
                  type="button"
                  className="btn-sm solid"
                  onClick={() => { router.push(routes.ideas); onClose() }}
                >
                  <DI.Bulb /> View My Ideas
                </button>
                <button type="button" className="btn-sm ghost" onClick={onClose}>
                  Close
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (typeof document === 'undefined') return null
  return createPortal(modal, document.body)
}
