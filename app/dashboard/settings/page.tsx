'use client'
import { useState } from 'react'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

function SetCard({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
        <h3 style={{ fontWeight: 400, fontSize: 17, letterSpacing: '-0.02em', color: 'var(--fg)' }}>{title}</h3>
        {desc && <p style={{ fontSize: 13, color: 'var(--fg-2)', lineHeight: 1.5 }}>{desc}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 16, padding: '12px 0', borderTop: '1px solid var(--line)' }}>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--fg)', letterSpacing: '-0.005em' }}>{label}</div>
        {hint && <div style={{ fontSize: 12, color: 'var(--fg-3)', marginTop: 4, lineHeight: 1.5 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--line-2)', background: 'var(--bg-2)', color: 'var(--fg)', font: 'inherit', fontSize: 13.5, outline: 0 }

function Toggle({ on, onChange }: { on: boolean; onChange?: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange?.(!on)} style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--accent)' : 'color-mix(in srgb, var(--fg) 8%, transparent)', position: 'relative', transition: 'background .2s', border: '1px solid var(--line-2)', cursor: 'pointer' }}>
      <span style={{ position: 'absolute', top: 1, left: on ? 16 : 1, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left .2s', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}/>
    </button>
  )
}

const sections = [
  { id: 'account',   label: 'Account',        icon: <DI.Cog/> },
  { id: 'workspace', label: 'Workspace',       icon: <DI.Folder/> },
  { id: 'ai',        label: 'AI preferences', icon: <DI.Sparkles/> },
  { id: 'notifs',    label: 'Notifications',  icon: <DI.Bell/> },
  { id: 'billing',   label: 'Plan & billing', icon: <DI.Bolt/> },
]

export default function SettingsPage() {
  const [section, setSection] = useState('account')
  const [reasoning, setReasoning] = useState(true)
  const [auto, setAuto] = useState(true)
  const [refresh, setRefresh] = useState(false)

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Settings</div>
          <h1>Configure your <em>workspace</em>.</h1>
          <div className="ph-sub">Account, AI behavior, exports and billing — all in one place.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 10 }}>
          {sections.map(s => (
            <button key={s.id} className={`sb-item ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {section === 'account' && (
            <SetCard title="Profile" desc="How you appear across the workspace.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#e4a89c,#a36b58)' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: 'var(--fg)', letterSpacing: '-0.01em' }}>Alex Brennan</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>alex@brennan.studio · founder</div>
                </div>
                <button className="btn-sm ghost">Change avatar</button>
              </div>
              <Field label="Full name"><input style={inp} defaultValue="Alex Brennan"/></Field>
              <Field label="Email" hint="Used for login and beta notifications."><input style={inp} defaultValue="alex@brennan.studio"/></Field>
              <Field label="Role"><input style={inp} defaultValue="Founder · solo"/></Field>
              <Field label="Time zone"><input style={inp} defaultValue="(UTC-08:00) Pacific Time"/></Field>
            </SetCard>
          )}
          {section === 'workspace' && (
            <>
              <SetCard title="Workspace" desc="Branding and defaults for Alex's Lab.">
                <Field label="Workspace name"><input style={inp} defaultValue="Alex's Lab"/></Field>
                <Field label="Slug" hint="Used in shareable export links."><input style={inp} defaultValue="alex-lab"/></Field>
                <Field label="Default category"><input style={inp} defaultValue="Consumer"/></Field>
              </SetCard>
              <SetCard title="Members" desc="Solo workspace · upgrade to add seats.">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#e4a89c,#a36b58)' }}/>
                    <div>
                      <div style={{ fontSize: 13.5, color: 'var(--fg)' }}>Alex Brennan</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)' }}>Owner</div>
                    </div>
                  </div>
                  <button className="btn-sm ghost"><DI.Plus/> Invite (Pro)</button>
                </div>
              </SetCard>
            </>
          )}
          {section === 'ai' && (
            <SetCard title="AI behavior" desc="Tune how the Copilot reasons and surfaces insights.">
              <Field label="Default model" hint="Used for free-form reasoning."><input style={inp} defaultValue="gpt-4o · founder tier"/></Field>
              <Field label="Show reasoning steps" hint="Show how the Copilot reached its recommendation."><Toggle on={reasoning} onChange={setReasoning}/></Field>
              <Field label="Auto-refine new ideas" hint="Run a first-pass refinement when you capture an idea."><Toggle on={auto} onChange={setAuto}/></Field>
              <Field label="Hourly competitor refresh" hint="Free tier refreshes daily. Founder tier hourly."><Toggle on={refresh} onChange={setRefresh}/></Field>
              <Field label="Tone of voice"><input style={inp} defaultValue="Direct, founder-shaped"/></Field>
            </SetCard>
          )}
          {section === 'notifs' && (
            <SetCard title="Notifications" desc="Choose what shows up in the watchtower.">
              {[
                { l: 'Market gap detected',    d: 'When a new white-space gap is found.' },
                { l: 'Competitor moved',        d: 'When a competitor ships or funds.' },
                { l: 'Positioning suggestion',  d: 'When a sharper positioning is found.' },
                { l: 'Weekly digest',           d: 'Friday digest of the week\'s intelligence.' },
                { l: 'Roadmap reminders',       d: 'Reminders to review stalled phases.' },
              ].map(it => <Field key={it.l} label={it.l} hint={it.d}><Toggle on={true}/></Field>)}
            </SetCard>
          )}
          {section === 'billing' && (
            <SetCard title="Plan" desc="You're on the Spark (free) plan.">
              <div style={{ padding: 18, borderRadius: 12, background: 'linear-gradient(160deg, var(--accent-soft), transparent 70%) var(--surface)', border: '1px solid var(--accent-line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 24, marginBottom: 12 }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--accent)' }}>Recommended · Founder</div>
                  <div style={{ fontSize: 22, color: 'var(--fg)', letterSpacing: '-0.025em', marginTop: 6 }}>$24 <span style={{ fontSize: 13, color: 'var(--fg-3)', fontFamily: 'var(--font-mono)' }}>/ mo</span></div>
                  <p style={{ fontSize: 13, color: 'var(--fg-2)', marginTop: 6, maxWidth: 360, lineHeight: 1.5 }}>Unlimited ideas, hourly competitor refresh, priority Copilot model, roadmap export.</p>
                </div>
                <button className="btn-sm solid">Upgrade now <DI.Arrow/></button>
              </div>
              <Field label="Payment method"><span style={{ color: 'var(--fg-3)', fontSize: 13 }}>No card on file</span></Field>
              <Field label="Invoices"><span style={{ color: 'var(--fg-3)', fontSize: 13 }}>None yet</span></Field>
            </SetCard>
          )}
        </div>
      </div>
    </div>
  )
}