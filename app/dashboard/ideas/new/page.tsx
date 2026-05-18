'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdeaAPI, type PriorityEnum } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const inp: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: 10,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-2)',
  color: 'var(--fg)',
  font: 'inherit',
  fontSize: 14,
  outline: 0,
}

export default function NewIdeaPage() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<PriorityEnum>('medium')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const idea = await IdeaAPI.createIdea({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      })
      router.push(routes.idea(idea.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">New idea</div>
          <h1>Capture a <em>spark</em>.</h1>
          <div className="ph-sub">Saved to your workspace via the API.</div>
        </div>
        <div className="page-head-actions">
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.ideas)}>
            <DI.CaretRight style={{ transform: 'rotate(180deg)' }}/> Back
          </button>
        </div>
      </div>

      <form className="card" onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && (
          <div style={{ color: 'var(--warn)', fontSize: 13, fontFamily: 'var(--font-mono)' }}>{error}</div>
        )}
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--fg-3)' }}>Title</span>
          <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="What's the idea?" required disabled={saving} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--fg-3)' }}>Description</span>
          <textarea style={{ ...inp, minHeight: 120, resize: 'vertical' }} value={description} onChange={e => setDescription(e.target.value)} placeholder="What problem does it solve?" disabled={saving} />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--fg-3)' }}>Priority</span>
          <select style={inp} value={priority} onChange={e => setPriority(e.target.value as PriorityEnum)} disabled={saving}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, textTransform: 'uppercase', color: 'var(--fg-3)' }}>Tags</span>
          <input style={inp} value={tags} onChange={e => setTags(e.target.value)} placeholder="AI, B2B, SaaS (comma-separated)" disabled={saving} />
        </label>
        <div style={{ display: 'flex', gap: 10, paddingTop: 8 }}>
          <button type="submit" className="btn-sm solid" disabled={saving}>
            {saving ? 'Saving…' : 'Create idea'}
          </button>
          <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.copilot)} disabled={saving}>
            <DI.Spark/> Refine with Copilot
          </button>
        </div>
      </form>
    </div>
  )
}
