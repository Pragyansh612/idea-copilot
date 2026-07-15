'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CommentAPI, type Comment } from '@/lib/api/comment'
import { timeAgo } from '@/lib/dashboard/format'
import * as DI from '@/components/dashboard/Icons'

interface Props {
  ideaId: string
  currentUserId?: string
}

function authorInitial(email: string | null): string {
  if (!email) return '?'
  return email[0].toUpperCase()
}

function CommentItem({
  comment,
  depth,
  currentUserId,
  onReply,
  onDelete,
  onEdit,
  editingId,
  editText,
  onEditTextChange,
  onEditSave,
  onEditCancel,
}: {
  comment: Comment
  depth: number
  currentUserId?: string
  onReply: (parentId: string, authorEmail: string | null) => void
  onDelete: (id: string) => void
  onEdit: (id: string, current: string) => void
  editingId: string | null
  editText: string
  onEditTextChange: (text: string) => void
  onEditSave: (id: string) => void
  onEditCancel: () => void
}) {
  const isOwn = currentUserId && comment.user_id === currentUserId
  const isEditing = editingId === comment.id

  return (
    <div className={`cmt-item ${depth > 0 ? 'cmt-reply' : ''}`} style={{ marginLeft: depth > 0 ? 28 : 0 }}>
      {isEditing ? (
        <div className="cmt-edit-wrap dash-card">
          <textarea
            className="cmt-input"
            rows={3}
            value={editText}
            onChange={e => onEditTextChange(e.target.value)}
            autoFocus
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-sm solid" onClick={() => onEditSave(comment.id)}>Save</button>
            <button type="button" className="btn-sm ghost" onClick={onEditCancel}>Cancel</button>
          </div>
        </div>
      ) : (
        <div className="cmt-row">
          <div className="cmt-av">{authorInitial(comment.author_email)}</div>
          <div className="cmt-body">
            <div className="cmt-meta">
              <span className="cmt-author">{comment.author_email ?? 'You'}</span>
              <span className="cmt-time">{timeAgo(comment.created_at)}</span>
              {comment.is_ai_generated && (
                <span className="cmt-ai-badge"><DI.Sparkles /> Copilot</span>
              )}
            </div>
            <div className="cmt-text">{comment.content}</div>
            <div className="cmt-actions">
              <button
                type="button"
                className="cmt-act"
                onClick={() => onReply(comment.id, comment.author_email)}
              >
                <DI.Chat /> Reply
              </button>
              {isOwn && (
                <>
                  <button type="button" className="cmt-act" onClick={() => onEdit(comment.id, comment.content)}>
                    <DI.Pencil /> Edit
                  </button>
                  <button type="button" className="cmt-act danger" onClick={() => onDelete(comment.id)}>
                    <DI.Trash /> Delete
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      {(comment.replies ?? []).map(r => (
        <CommentItem
          key={r.id}
          comment={r}
          depth={depth + 1}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          onEdit={onEdit}
          editingId={editingId}
          editText={editText}
          onEditTextChange={onEditTextChange}
          onEditSave={onEditSave}
          onEditCancel={onEditCancel}
        />
      ))}
    </div>
  )
}

export function CommentsSection({ ideaId, currentUserId }: Props) {
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [text, setText] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; email: string | null } | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [error, setError] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await CommentAPI.getIdeaComments(ideaId)
      setComments(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load comments')
    } finally {
      setLoading(false)
    }
  }, [ideaId])

  useEffect(() => { void load() }, [load])

  async function submit() {
    const content = text.trim()
    if (!content) return
    try {
      setSending(true)
      const comment = await CommentAPI.createIdeaComment(ideaId, content, replyTo?.id)
      if (replyTo) {
        setComments(prev => prev.map(c =>
          c.id === replyTo.id
            ? { ...c, replies: [...(c.replies ?? []), comment] }
            : c
        ))
      } else {
        setComments(prev => [...prev, comment])
      }
      setText('')
      setReplyTo(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post comment')
    } finally {
      setSending(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this comment?')) return
    try {
      await CommentAPI.deleteComment(id)
      setComments(prev => prev
        .filter(c => c.id !== id)
        .map(c => ({ ...c, replies: (c.replies ?? []).filter(r => r.id !== id) }))
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete comment')
    }
  }

  async function handleEditSave(id: string) {
    const content = editText.trim()
    if (!content) return
    try {
      const updated = await CommentAPI.updateComment(id, content)
      setComments(prev => prev.map(c => {
        if (c.id === id) return { ...c, content: updated.content }
        return { ...c, replies: (c.replies ?? []).map(r => r.id === id ? { ...r, content: updated.content } : r) }
      }))
      setEditingId(null)
      setEditText('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update comment')
    }
  }

  function startReply(parentId: string, email: string | null) {
    setReplyTo({ id: parentId, email })
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function startEdit(id: string, current: string) {
    setEditingId(id)
    setEditText(current)
  }

  const totalCount = comments.reduce((acc, c) => acc + 1 + (c.replies?.length ?? 0), 0)

  return (
    <div className="cmt-section">
      <div className="id-panel-head">
        <h3>Discussion <span className="count">{totalCount}</span></h3>
      </div>

      {error && (
        <div className="dash-card" style={{ padding: 12, background: 'color-mix(in srgb, var(--bad) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--bad) 30%, transparent)', marginBottom: 12 }}>
          <span style={{ color: 'var(--bad)', fontSize: 13 }}>{error}</span>
        </div>
      )}

      <div className="cmt-compose dash-card">
        {replyTo && (
          <div className="cmt-reply-ctx">
            <DI.ArrowRight /> Replying to <strong>{replyTo.email ?? 'you'}</strong>
            <button type="button" className="cmt-act" onClick={() => setReplyTo(null)}>Cancel</button>
          </div>
        )}
        <textarea
          ref={textareaRef}
          className="cmt-input"
          rows={3}
          placeholder={replyTo ? `Reply to ${replyTo.email ?? 'comment'}…` : 'Share your thoughts, questions, or feedback…'}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              void submit()
            }
          }}
        />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--fg-3)', alignSelf: 'center' }}>⌘↵ to send</span>
          <button
            type="button"
            className="btn-sm solid"
            onClick={() => void submit()}
            disabled={sending || !text.trim()}
          >
            <DI.Send /> {sending ? 'Posting…' : replyTo ? 'Post Reply' : 'Post Comment'}
          </button>
        </div>
      </div>

      {loading ? (
        <p style={{ color: 'var(--fg-2)', fontSize: 14, padding: '12px 0' }}>Loading discussion…</p>
      ) : comments.length === 0 ? (
        <div className="cmt-empty">
          <DI.Chat />
          <p>No comments yet. Start the discussion.</p>
        </div>
      ) : (
        <div className="cmt-list">
          {comments.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              depth={0}
              currentUserId={currentUserId}
              onReply={startReply}
              onDelete={handleDelete}
              onEdit={startEdit}
              editingId={editingId}
              editText={editText}
              onEditTextChange={setEditText}
              onEditSave={id => void handleEditSave(id)}
              onEditCancel={() => { setEditingId(null); setEditText('') }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
