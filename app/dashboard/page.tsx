'use client'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'

function Spark({ data, className }: { data: number[]; className?: string }) {
  const w = 72, h = 26
  const min = Math.min(...data), max = Math.max(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / range) * (h - 4) - 2
    return `${x},${y}`
  }).join(' ')
  const area = `0,${h} ${points} ${w},${h}`
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon points={area} fill="url(#sg)" />
      <polyline points={points} fill="none" stroke="var(--accent)" strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  )
}

const RECENT_IDEAS = [
  { id: 'Hyper-local audio',  badge: { text: 'HOT WEDGE', kind: 'hot' },  score: 87, title: <>Hyper-local <em>audio</em> for neighborhoods</>,       desc: 'Async voice notes within a 3-block radius. Trust from proximity, not identity.', progress: 64, tags: ['Consumer','Voice','Social'], when: '2m ago' },
  { id: 'AI grant assistant', badge: { text: 'VALIDATING', kind: '' },     score: 72, title: <>AI <em>grant</em> assistant for indie research</>,       desc: 'Match indie researchers to relevant grants. Auto-draft the packet.',             progress: 38, tags: ['B2B','AI','Research'],        when: '4h ago' },
  { id: 'Drone logistics',    badge: { text: 'STALLED', kind: 'warn' },    score: 41, title: 'Drone logistics for short-haul rural medical',            desc: 'On-demand insulin delivery in rural corridors. Hub-and-spoke from county clinics.', progress: 12, tags: ['Hardware','Health'],        when: 'yesterday' },
  { id: 'Studio OS',          badge: { text: 'DRAFT', kind: '' },          score: 58, title: <>An <em>operating system</em> for solo studios</>,         desc: 'One workspace for the bets, the time, the books, the contracts.',               progress: 22, tags: ['SaaS','Studio'],              when: '3d ago' },
  { id: 'Field-note CRM',     badge: { text: 'EXPLORING', kind: '' },      score: 64, title: 'Field-note CRM for in-person sellers',                    desc: 'Reps record after a meeting; the CRM is filled in by AI.',                       progress: 30, tags: ['B2B','Sales','AI'],           when: '5d ago' },
  { id: 'Quiet API',          badge: { text: 'WEDGE LOCKED', kind: 'hot' }, score: 81, title: <>The <em>quiet</em> API — webhooks, sans Slack noise</>, desc: 'A digest layer for webhook chaos. Right alerts, right humans, right cadence.',   progress: 52, tags: ['DevTool','Infra'],            when: '1w ago' },
]

export default function DashboardHome() {
  const router = useRouter()
  const now = new Date()
  const dow = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][now.getDay()]
  const mon = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][now.getMonth()]

  const stats = [
    { label: 'Total ideas',          icon: <DI.Bulb/>,     value: '24',  delta: '+3 this week', spark: [12,14,13,17,16,19,21,24] },
    { label: 'Active projects',      icon: <DI.Folder/>,   value: '7',   delta: '+1 active',    spark: [3,4,4,5,6,6,7,7] },
    { label: 'AI suggestions',       icon: <DI.Sparkles/>, value: '182', delta: '+24 today',    spark: [120,128,138,140,148,158,170,182] },
    { label: 'Market opportunities', icon: <DI.Target/>,   value: '12',  delta: '+2 new',       spark: [6,7,8,8,9,10,11,12] },
    { label: 'Competitors analyzed', icon: <DI.Radar/>,    value: '94',  delta: '+8 this week', spark: [60,68,72,78,84,88,90,94] },
    { label: 'Productivity score',   icon: <DI.Trend/>,    value: '86',  delta: '+4 pts',       spark: [70,72,74,78,80,82,84,86] },
  ]

  return (
    <div className="page">
      {/* Hello banner */}
      <div className="hello">
        <div className="hello-grid"/>
        <div className="hello-inner">
          <div>
            <div className="hello-now">
              <span className="pulse"/>
              {dow}, {mon} {now.getDate()} · {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              <span style={{ color: 'var(--fg-4)' }}>·</span>
              Last sync · 12s ago
            </div>
            <h1>Welcome back, <em>Alex</em>.</h1>
            <div className="h-sub">
              <b>3 ideas</b> evolved this week. <b>2 market gaps</b> detected overnight.
              Your Copilot has <b>4 recommendations</b> waiting in <i>Hyper-local audio</i>.
            </div>
          </div>
          <div className="hello-actions">
            <button className="btn-sm solid" onClick={() => router.push('/dashboard/ideas')}><DI.Plus/> New idea</button>
            <button className="btn-sm ghost" onClick={() => router.push('/dashboard/copilot')}><DI.Spark/> Ask Copilot</button>
            <button className="btn-sm ghost" onClick={() => router.push('/dashboard/competitors')}><DI.Radar/> Discover competitors</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="section-block">
        <div className="section-block-head">
          <h2>This <em>week</em>, at a glance</h2>
          <span className="sb-sub">last 7 days · auto-updates</span>
        </div>
        <div className="stats">
          {stats.map(s => (
            <div key={s.label} className="stat">
              <div className="s-label">{s.icon} {s.label}</div>
              <div className="s-value">{s.value}</div>
              <div className="s-delta"><DI.Up/> {s.delta}</div>
              <Spark className="s-spark" data={s.spark} />
            </div>
          ))}
        </div>
      </div>

      {/* Recent ideas */}
      <div className="section-block">
        <div className="section-block-head">
          <h2>Recent <em>ideas</em></h2>
          <a className="sb-link" onClick={() => router.push('/dashboard/ideas')} style={{ cursor: 'pointer' }}>View all 24 →</a>
        </div>
        <div className="ideas-grid">
          {RECENT_IDEAS.map(i => (
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
      </div>

      {/* AI Insights */}
      <div className="section-block">
        <div className="section-block-head">
          <h2>AI <em>insights</em> · overnight</h2>
          <span className="sb-sub">3 new · across 4 ideas</span>
        </div>
        <div className="insights">
          <div className="insight accent">
            <span className="i-kind"><DI.Target/> Market gap detected</span>
            <h4>No competitor combines <em>async voice</em> with neighborhood-level moderation.</h4>
            <p>Mapped 14 players across the hyperlocal social category. Established companies index on broadcast and identity; the wedge sits in trust + ephemerality.</p>
            <div className="i-meta">
              <span>signal <strong style={{ color: 'var(--good)' }}>HIGH</strong></span>
              <span>confidence <strong>92%</strong></span>
              <span>TAM <strong>$2.4B</strong></span>
              <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>Hyper-local audio</span>
            </div>
          </div>
          <div className="insight">
            <span className="i-kind"><DI.Radar/> Competitor moved</span>
            <h4>Trace shipped a community feature in their last release.</h4>
            <p>Their roadmap suggests proximity-aware moderation by Q4. ≈3 weeks of runway before your wedge narrows.</p>
            <div className="i-meta">
              <span>priority <strong style={{ color: 'var(--warn)' }}>HIGH</strong></span>
              <span>recommend <strong>ship moderation</strong></span>
            </div>
          </div>
          <div className="insight">
            <span className="i-kind"><DI.Sparkles/> Positioning · best variant</span>
            <h4><em>&ldquo;Snapchat for blocks&rdquo;</em> is the strongest framing across 5 tested variants.</h4>
            <p>Indexes highest on memorability (8.4 / 10) and lowest on category confusion. Recommended as the lead hook.</p>
            <div className="i-meta">
              <span>variants <strong>5</strong></span>
              <span>winner <strong>v3</strong></span>
              <span style={{ marginLeft: 'auto', color: 'var(--fg-3)' }}>Hyper-local audio</span>
            </div>
          </div>
          <div className="insight">
            <span className="i-kind"><DI.Bolt/> Quick win</span>
            <h4>Apartment-block organizers index 4× higher on early-adopter signals.</h4>
            <p>Beta should target organizers, not residents. Land-and-expand from one organizer per building.</p>
            <div className="i-meta">
              <span>lift <strong>4.0×</strong></span>
              <span>effort <strong>low</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}