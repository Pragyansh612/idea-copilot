'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

const NOTIFS = [
  { kind: 'gap',  title: 'Market gap detected', body: 'Async voice + neighborhood moderation — no incumbent.', when: '2m ago', idea: 'Hyper-local audio', unread: true },
  { kind: 'comp', title: 'Competitor moved',     body: 'Trace shipped a community feature in last release.',   when: '12m ago', idea: 'Hyper-local audio', unread: true },
  { kind: 'sug',  title: 'Positioning ready',    body: '"Snapchat for blocks" indexes highest across 5 variants.', when: '1h ago', idea: 'Hyper-local audio', unread: true },
  { kind: 'win',  title: 'Quick win',            body: 'Organizer-first beta indexes 4× higher than residents.', when: '3h ago', idea: 'Hyper-local audio', unread: true },
  { kind: 'comp', title: 'Competitor added',     body: 'Atelier — solo dev studio · seed funded · low overlap.', when: 'yesterday', idea: 'Studio OS', unread: true },
  { kind: 'sug',  title: 'Wedge re-tested',      body: 'Indie research grants — confidence improved to 78%.', when: '2d ago', idea: 'AI grant assistant' },
  { kind: 'win',  title: 'Refresh scheduled',    body: 'Competitor scan will auto-run Friday at 9am.', when: '3d ago' },
]

function notifIcon(kind: string): ReactNode {
  const icons: Record<string, ReactNode> = { gap: <DI.Target/>, comp: <DI.Radar/>, sug: <DI.Sparkles/>, win: <DI.Bolt/> }
  return icons[kind] ?? <DI.Bell/>
}

export default function NotificationsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState('All')
  const filters = ['All', 'Gaps', 'Competitors', 'Suggestions', 'Wins']
  const filtered = NOTIFS.filter(n => {
    if (filter === 'All') return true
    if (filter === 'Gaps') return n.kind === 'gap'
    if (filter === 'Competitors') return n.kind === 'comp'
    if (filter === 'Suggestions') return n.kind === 'sug'
    if (filter === 'Wins') return n.kind === 'win'
    return true
  })
  const unread = NOTIFS.filter(n => n.unread).length

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Notifications · {unread} unread</div>
          <h1>The Copilot&apos;s <em>watchtower</em>.</h1>
          <div className="ph-sub">Market gaps, competitor moves, fresh suggestions — everything the AI noticed while you weren&apos;t looking.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost"><DI.Check/> Mark all read</button>
          <button className="btn-sm ghost"><DI.Cog/> Notification settings</button>
        </div>
      </div>

      <div className="ideas-filterbar">
        <div className="chips">
          {filters.map(f => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        {filtered.map((n, i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 1fr auto', gap: 14, padding: '14px 18px', borderBottom: i === filtered.length - 1 ? 0 : '1px solid var(--line)', alignItems: 'center', background: n.unread ? 'color-mix(in srgb, var(--accent) 4%, transparent)' : 'transparent', cursor: 'pointer', transition: 'background .15s' }}>
            <span style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', color: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {notifIcon(n.kind)}
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 14, letterSpacing: '-0.005em', color: 'var(--fg)' }}>{n.title}</span>
                {n.unread && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }}/>}
                {n.idea && (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, padding: '2px 7px', borderRadius: 4, background: 'color-mix(in srgb, var(--fg) 4%, transparent)', color: 'var(--fg-3)', cursor: 'pointer' }}
                    onClick={e => { e.stopPropagation(); router.push(`/dashboard/ideas/${encodeURIComponent(n.idea!)}`) }}>
                    {n.idea}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 4, letterSpacing: '-0.005em' }}>{n.body}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)', letterSpacing: '0.02em' }}>{n.when}</span>
          </div>
        ))}
      </div>
    </div>
  )
}