'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdeaAPI, type PriorityEnum } from '@/lib/api/idea'
import {
  clearIdeaDraft,
  hasDraftContent,
  type IdeaDraft,
  type IdeaDraftField,
} from '@/lib/copilot/idea-draft'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

const inp: React.CSSProperties = {
  width: '100%',
  padding: '8px 12px',
  borderRadius: 8,
  border: '1px solid var(--line-2)',
  background: 'var(--bg-2)',
  color: 'var(--fg)',
  font: 'inherit',
  fontSize: 13,
  outline: 0,
}

type IdeaDraftPanelProps = {
  draft: IdeaDraft
  onChange: (draft: IdeaDraft) => void
  onDismiss: () => void
}

export default function IdeaDraftPanel({ draft, onChange, onDismiss }: IdeaDraftPanelProps) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function toggleField(field: IdeaDraftField) {
    onChange({
      ...draft,
      included: { ...draft.included, [field]: !draft.included[field] },
    })
  }

  function update<K extends keyof IdeaDraft>(key: K, value: IdeaDraft[K]) {
    onChange({ ...draft, [key]: value })
  }

  async function createIdea() {
    if (!draft.included.title || !draft.title.trim()) {
      setError('Enable and fill in a title to create the idea')
      return
    }
    try {
      setSaving(true)
      setError(null)
      const idea = await IdeaAPI.createIdea({
        title: draft.title.trim(),
        description: draft.included.description ? draft.description.trim() || undefined : undefined,
        priority: draft.included.priority ? draft.priority : 'medium',
        tags: draft.included.tags ? draft.tags : [],
      })
      clearIdeaDraft()
      router.push(routes.idea(idea.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create idea')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="idea-draft-panel card">
      <div className="idea-draft-head">
        <div>
          <div className="eyebrow-mono">Idea draft</div>
          <p className="idea-draft-sub">
            Toggle fields to include in Copilot messages, or create the idea when ready.
          </p>
        </div>
        <button type="button" className="btn-sm ghost" onClick={onDismiss}>Dismiss</button>
      </div>

      {error && <p style={{ color: 'var(--warn)', fontSize: 13 }}>{error}</p>}

      <div className="idea-draft-fields">
        <DraftFieldRow
          label="Title"
          field="title"
          included={draft.included.title}
          onToggle={() => toggleField('title')}
        >
          <input
            style={inp}
            value={draft.title}
            onChange={e => update('title', e.target.value)}
            placeholder="Idea title"
            disabled={!draft.included.title}
          />
        </DraftFieldRow>

        <DraftFieldRow
          label="Description"
          field="description"
          included={draft.included.description}
          onToggle={() => toggleField('description')}
        >
          <textarea
            style={{ ...inp, minHeight: 72, resize: 'vertical' }}
            value={draft.description}
            onChange={e => update('description', e.target.value)}
            placeholder="What problem does it solve?"
            disabled={!draft.included.description}
          />
        </DraftFieldRow>

        <DraftFieldRow
          label="Priority"
          field="priority"
          included={draft.included.priority}
          onToggle={() => toggleField('priority')}
        >
          <select
            style={inp}
            value={draft.priority}
            onChange={e => update('priority', e.target.value as PriorityEnum)}
            disabled={!draft.included.priority}
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </DraftFieldRow>

        <DraftFieldRow
          label="Tags"
          field="tags"
          included={draft.included.tags}
          onToggle={() => toggleField('tags')}
        >
          <input
            style={inp}
            value={draft.tags.join(', ')}
            onChange={e =>
              update(
                'tags',
                e.target.value.split(',').map(t => t.trim()).filter(Boolean),
              )
            }
            placeholder="AI, B2B, SaaS"
            disabled={!draft.included.tags}
          />
        </DraftFieldRow>
      </div>

      <div className="idea-draft-actions">
        <button
          type="button"
          className="btn-sm solid"
          onClick={createIdea}
          disabled={saving || !hasDraftContent(draft)}
        >
          {saving ? 'Creating…' : 'Create idea from draft'}
        </button>
        <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.newIdea)}>
          <DI.Plus/> Open full form
        </button>
      </div>
    </div>
  )
}

function DraftFieldRow({
  label,
  included,
  onToggle,
  children,
}: {
  label: string
  field: string
  included: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className={`idea-draft-row ${included ? '' : 'idea-draft-row--off'}`}>
      <label className="idea-draft-toggle">
        <input type="checkbox" checked={included} onChange={onToggle} />
        <span>{label}</span>
      </label>
      {children}
    </div>
  )
}
