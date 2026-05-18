'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'

const ALL_IDEAS = [
  { id: 'Hyper-local audio',   cat: 'Consumer',  status: 'Active',     pri: 'P0', score: 87, badge: { text: 'HOT WEDGE', kind: 'hot' },       title: <>Hyper-local <em>audio</em> for neighborhoods</>,        desc: 'Async voice notes in a 3-block radius. Snapchat for blocks.', progress: 64, tags: ['Voice','Social'],      when: '2m ago' },
  { id: 'AI grant assistant',  cat: 'B2B',       status: 'Validating', pri: 'P1', score: 72, badge: { text: 'VALIDATING', kind: '' },           title: <>AI <em>grant</em> assistant for indie research</>,        desc: 'Match researchers to grants. Auto-draft the packet.',          progress: 38, tags: ['AI','Research'],        when: '4h ago' },
  { id: 'Drone logistics',     cat: 'Hardware',  status: 'Stalled',    pri: 'P2', score: 41, badge: { text: 'STALLED', kind: 'warn' },          title: 'Drone logistics for rural medical',                       desc: 'Insulin and antivenom hub-and-spoke from county clinics.',      progress: 12, tags: ['Health','Logistics'],   when: 'yesterday' },
  { id: 'Studio OS',           cat: 'SaaS',      status: 'Draft',      pri: 'P1', score: 58, badge: { text: 'DRAFT', kind: '' },                title: <>An <em>operating system</em> for solo studios</>,         desc: 'One workspace for bets, time, books, contracts.',               progress: 22, tags: ['Studio','SaaS'],        when: '3d ago' },
  { id: 'Field-note CRM',      cat: 'B2B',       status: 'Active',     pri: 'P0', score: 64, badge: { text: 'EXPLORING', kind: '' },            title: 'Field-note CRM for in-person sellers',                    desc: "Reps record after a meeting; the CRM fills itself in.",          progress: 30, tags: ['Sales','AI'],           when: '5d ago' },
  { id: 'Quiet API',           cat: 'DevTool',   status: 'Active',     pri: 'P0', score: 81, badge: { text: 'WEDGE LOCKED', kind: 'hot' },      title: <>The <em>quiet</em> API — webhooks, sans Slack noise</>,  desc: 'A digest layer for webhook chaos. Right alerts, right cadence.', progress: 52, tags: ['Infra','DevTool'],      when: '1w ago' },
  { id: 'Inventory whisperer', cat: 'B2B',       status: 'Draft',      pri: 'P2', score: 36, badge: { text: 'DRAFT', kind: '' },                title: 'Inventory whisperer for restaurants',                     desc: 'Forecasts prep par from POS + weather + events. SMS-first ops.', progress: 8,  tags: ['Hospitality'],          when: '2w ago' },
  { id: 'Field zine',          cat: 'Consumer',  status: 'Draft',      pri: 'P2', score: 44, badge: { text: 'DRAFT', kind: '' },                title: <>A <em>field-zine</em> for hobbyist communities</>,        desc: 'Print-quality micro-zines on a 28-day cadence.',                progress: 14, tags: ['Print','Community'],    when: '2w ago' },
  { id: 'Permit Copilot',      cat: 'B2B',       status: 'Validating', pri: 'P1', score: 69, badge: { text: 'VALIDATING', kind: '' },           title: 'Permit Copilot for small contractors',                    desc: 'Submits, tracks and chases municipal permits. AI fills forms.',  progress: 33, tags: ['Civic','SMB'],          when: '3w ago' },
]

const FILTERS = ['All', 'Active', 'Validating', 'Draft', 'Stalled']
const CATEGORIES = ['All categories', 'Consumer', 'B2B', 'DevTool', 'Hardware', 'SaaS']

export default function MyIdeasPage() {
  const router = useRouter()
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [filter, setFilter] = useState('All')
  const [cat, setCat] = useState('All categories')

  const list = ALL_IDEAS.filter(i =>
    (filter === 'All' || i.status === filter) &&
    (cat === 'All categories' || i.cat === cat)
  )

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">My Ideas · {ALL_IDEAS.length} total</div>
          <h1>Every spark you&apos;ve <em>filed</em>.</h1>
          <div className="ph-sub">Drafts, validations, active projects — sorted by how recently the Copilot reasoned about them.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost"><DI.Filter/> Filter</button>
          <button className="btn-sm solid"><DI.Plus/> New idea</button>
        </div>
      </div>

      <div className="ideas-filterbar">
        <div className="seg">
          <button className={view === 'grid' ? 'on' : ''} onClick={() => setView('grid')}><DI.Grid/> Grid</button>
          <button className={view === 'list' ? 'on' : ''} onClick={() => setView('list')}><DI.List/> List</button>
        </div>
        <div className="chips">
          {FILTERS.map(f => <button key={f} className={`chip ${filter === f ? 'on' : ''}`} onClick={() => setFilter(f)}>{f}</button>)}
          <span style={{ width: 1, height: 18, background: 'var(--line-2)', margin: '0 4px' }}/>
          {CATEGORIES.map(c => <button key={c} className={`chip ${cat === c ? 'on' : ''}`} onClick={() => setCat(c)}>{c}</button>)}
        </div>
        <span className="sort"><DI.Down/> sort · recent</span>
      </div>

      {list.length === 0 ? (
        <div className="empty">
          <div className="em-icon"><DI.Bulb/></div>
          <h3>No ideas match this filter</h3>
          <p>Try widening your filter, or capture a new spark.</p>
        </div>
      ) : view === 'grid' ? (
        <div className="ideas-grid">
          {list.map(i => (
            <div key={i.id} className="idea" onClick={() => router.push(`/dashboard/ideas/${encodeURIComponent(i.id)}`)}>
              <div className="i-row1">
                <span className={`i-tag ${i.badge.kind}`}>{i.badge.text}</span>
                <span className="i-score">score · <b>{i.score}</b></span>
              </div>
              <h3>{i.title}</h3>
              <p className="i-desc">{i.desc}</p>
              <div className="i-prog"><div className="bar" style={{ width: `${i.progress}%` }}/></div>
              <div className="i-foot">
                <div className="tags">{i.tags.map(t => <span key={t}>{t}</span>)}</div>
                <span className="sep"/>
                <span>{i.when}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ padding: 0 }}>
          <div className="ci-table">
            <div className="ci-row h">
              <span/><span>Idea</span><span>Category</span><span>Status</span><span>Priority</span>
              <span style={{ textAlign: 'right' }}>Score</span>
            </div>
            {list.map(i => (
              <div key={i.id} className="ci-row" onClick={() => router.push(`/dashboard/ideas/${encodeURIComponent(i.id)}`)}>
                <span className="ci-logo">{i.id[0]}</span>
                <span className="ci-name">{i.id}<span className="sub">{i.tags.join(' · ')}</span></span>
                <span className="ci-mark">{i.cat}</span>
                <span><span className={`i-tag ${i.badge.kind}`}>{i.badge.text}</span></span>
                <span className="ci-mark">{i.pri}</span>
                <span className="ci-score">{i.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}