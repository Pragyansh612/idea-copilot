'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as DI from '@/components/dashboard/Icons'

const CP_HISTORY = [
  { id: 0, t: 'Suggest MVP features for hyperlocal audio', w: '2m ago',   active: true },
  { id: 1, t: 'How does Notable compare to FieldKit?',     w: 'today' },
  { id: 2, t: 'Make my positioning sharper',               w: 'today' },
  { id: 3, t: "Where's the white space in hyperlocal apps?", w: 'yesterday' },
  { id: 4, t: 'Draft a 12-week roadmap',                   w: 'yesterday' },
  { id: 5, t: 'Score AI grant assistant viability',        w: '3d ago' },
  { id: 6, t: 'Find underserved B2B markets',              w: '1w ago' },
]

const CP_SUGGESTIONS = ['Score the wedge', 'Compare to Trace', 'Refine the 60-second pitch', 'Suggest a 4-week beta plan', 'Find adjacent markets']

export default function CopilotPage() {
  const [active, setActive] = useState(0)
  const [draft, setDraft] = useState('')

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">AI Copilot · context · Hyper-local audio</div>
          <h1>Your AI product <em>strategist</em>, on tap.</h1>
          <div className="ph-sub">Reasons about your idea, your competitors, and your roadmap — not a wrapper around a chat box.</div>
        </div>
        <div className="page-head-actions">
          <button className="btn-sm ghost"><DI.Clock/> History</button>
          <button className="btn-sm ghost"><DI.Plus/> New chat</button>
        </div>
      </div>

      <div className="copilot-page">
        <div className="cp-history">
          <div className="ch-head">Conversations</div>
          {CP_HISTORY.map(h => (
            <button key={h.id} className={`ch-item ${active === h.id ? 'active' : ''}`} onClick={() => setActive(h.id)}>
              <span className="ch-title">{h.t}</span>
              <span className="ch-when">{h.w}</span>
            </button>
          ))}
        </div>

        <div className="cp-main">
          <div className="cp-head">
            <div className="ai-orb"/>
            <div className="cp-title">
              <span className="t1">Suggest MVP features for hyperlocal audio</span>
              <span className="t2">model · gpt-4o · context loaded</span>
            </div>
            <div className="ctx-chips">
              <span className="ctx-chip"><DI.Bulb/> Hyper-local audio</span>
              <span className="ctx-chip"><DI.Radar/> 14 competitors</span>
              <span className="ctx-chip"><DI.Target/> wedge: trust + ephemerality</span>
            </div>
          </div>

          <div className="cp-stream">
            <div className="cp-msg user">
              <div className="av"/>
              <div className="cp-bubble">Suggest MVP features for the hyperlocal audio app. Lean — what&apos;s the minimum cut that proves the wedge?</div>
            </div>
            <div className="cp-msg ai">
              <div className="av"/>
              <div className="cp-bubble">
                For a <strong>3-block-radius MVP</strong>, lead with async voice notes and skip profiles entirely.
                Trust comes from <em>proximity</em>, not identity — so the minimum cut is the proximity layer, not the audio layer.
                <div className="cp-card-inline">
                  <div className="cci-head">MVP · v0.1 · 5 features</div>
                  <div className="cci-row"><span className="k">P0</span><span className="v">Async voice notes (≤60s)</span></div>
                  <div className="cci-row"><span className="k">P0</span><span className="v">Block-verified address gating</span></div>
                  <div className="cci-row"><span className="k">P0</span><span className="v">Ephemeral 24-hour feed</span></div>
                  <div className="cci-row"><span className="k">P1</span><span className="v">Anonymous reactions + reports</span></div>
                  <div className="cci-row"><span className="k">P2</span><span className="v">Moderation primitives · API</span></div>
                </div>
                <div className="src">
                  <span className="s"><b>1</b> Hyper-local audio · idea brief</span>
                  <span className="s"><b>2</b> 14 competitors · radar</span>
                  <span className="s"><b>3</b> Market gap · trust + ephemerality</span>
                </div>
              </div>
            </div>
            <div className="cp-msg user">
              <div className="av"/>
              <div className="cp-bubble">Anything I&apos;m missing? Be brutal.</div>
            </div>
            <div className="cp-msg ai">
              <div className="av"/>
              <div className="cp-bubble">
                Three risks worth naming:<br/><br/>
                <strong>1. The address-gating layer is the moat.</strong> Ship it first, not last. Competitors can fake voice; they can&apos;t fake the proximity primitive.<br/><br/>
                <strong>2. Organizer-first GTM beats resident-first 4×.</strong> Apartment-block organizers index higher on early-adopter signals — recruit through them.<br/><br/>
                <strong>3. Trace shipped community last release.</strong> You have <em>≈3 weeks</em> of runway before the gap narrows. Move.
                <div className="src">
                  <span className="s"><b>1</b> Beta plan · v2</span>
                  <span className="s"><b>2</b> Trace · changelog 2.4</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cp-suggestions">
            {CP_SUGGESTIONS.map(s => <button key={s} className="cp-sugg">{s}</button>)}
          </div>

          <div className="cp-input-wrap">
            <div className="cp-input">
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                placeholder="Ask the Copilot anything about your ideas, market or roadmap…"
                rows={1}
              />
              <div className="cp-input-tools">
                <button title="Attach"><DI.Attach/></button>
                <button title="Voice"><DI.Mic/></button>
                <button title="Add context"><DI.Folder/></button>
                <button className="cp-send" title="Send"><DI.Send/></button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--fg-3)' }}>
              <span>context · Hyper-local audio · 14 competitors loaded</span>
              <span>⌘ ↵ to send · ⌥ ↵ for newline</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}