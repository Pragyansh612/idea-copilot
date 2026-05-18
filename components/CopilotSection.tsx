'use client'
import { useState, useEffect } from 'react'
import { IconArrow } from './Icons'

const FLOWS: Record<string, { user: string; aiBubble: string; card: { title: string; rows: [string, string][] } }> = {
  'Suggest MVP features': {
    user: 'Suggest MVP features for a hyperlocal audio app.',
    aiBubble: 'For a 3-block-radius MVP, lead with async voice notes and skip profiles entirely. Trust comes from proximity, not identity. Here\'s the minimum cut:',
    card: { title: 'MVP · v0.1', rows: [['P0','Async voice notes (≤60s)'],['P0','Block-verified addresses'],['P0','Ephemeral 24h feed'],['P1','Anonymous reactions'],['P2','Moderation primitives']] },
  },
  'Find underserved markets': {
    user: "Where's the white space in hyperlocal apps?",
    aiBubble: 'Mapped 14 competitors. The strongest gap sits between trust and ephemerality — async, anonymous, geo-bounded. Urban beta markets are unsaturated.',
    card: { title: 'Top 3 wedges', rows: [['01','Dense urban beta · apartments'],['02','Async voice + ephemerality'],['03','Trust without identity']] },
  },
  'Compare competitors': {
    user: 'How does Notable compare to FieldKit?',
    aiBubble: 'Notable is broadcast-shaped: identity-first, public, monetized via creator tools. FieldKit is mobile-native but indexes on text. Neither owns voice + locality.',
    card: { title: 'Side-by-side · positioning', rows: [['Notable','Broadcast · identity'],['FieldKit','Mobile · text-first'],['You','Voice · ephemeral · local']] },
  },
  'Improve positioning': {
    user: 'Make my positioning sharper.',
    aiBubble: 'Drop the feature language. Anchor on the felt experience: "Snapchat for blocks." Memorable, defensible, and category-aligned with the wedge.',
    card: { title: 'Positioning · v3', rows: [['Hook','Snapchat for blocks'],['Wedge','Trust + ephemerality'],['Buyer','Apartment-block organizers']] },
  },
}

export default function CopilotSection() {
  const [active, setActive] = useState('Suggest MVP features')
  const [streaming, setStreaming] = useState(false)
  const flow = FLOWS[active]

  useEffect(() => {
    setStreaming(true)
    const t = setTimeout(() => setStreaming(false), 650)
    return () => clearTimeout(t)
  }, [active])

  return (
    <section className="section" id="copilot">
      <div className="wrap">
        <div className="copilot-layout">
          <div className="copilot-left">
            <span className="eyebrow">04 — AI Copilot</span>
            <h3>Your AI product<br />strategist, <em>on tap.</em></h3>
            <p>Not a chatbot. A copilot that knows your idea, your competitors, your roadmap — and reasons about them like the smartest founder you&apos;ve ever worked with.</p>
            <div className="prompt-chips">
              {Object.keys(FLOWS).map((p) => (
                <button
                  key={p}
                  className={`prompt-chip ${active === p ? 'active' : ''}`}
                  onClick={() => setActive(p)}
                >{p}</button>
              ))}
            </div>
          </div>

          <div className="chat-window">
            <div className="chat-head">
              <div className="chat-dots"><span/><span/><span/></div>
              <span style={{ marginLeft: 8 }}>copilot · context loaded</span>
              <span className="right" style={{ marginLeft: 'auto' }}>online</span>
            </div>
            <div className="chat-stream">
              <div className="msg user">
                <div className="msg-avatar">YOU</div>
                <div className="msg-bubble">{flow.user}</div>
              </div>
              <div className="msg ai">
                <div className="msg-avatar" />
                <div className="msg-bubble">
                  {streaming ? (
                    <span className="typing"><span/><span/><span/></span>
                  ) : (
                    <>
                      {flow.aiBubble}
                      <div className="msg-card">
                        <div className="mc-title">{flow.card.title}</div>
                        {flow.card.rows.map((r, i) => (
                          <div key={i} className="row">
                            <span className="key">{r[0]}</span>
                            <span className="val">{r[1]}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="chat-input">
              <span className="prompt-glyph">→</span>
              <input placeholder="Ask the copilot anything…" defaultValue="" />
              <span className="kbd">⌘ ↵</span>
              <button className="chat-send"><IconArrow style={{ color: 'white' }}/></button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}