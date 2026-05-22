'use client'
import { useEffect, useState } from 'react'
import { AuthAPI } from '@/lib/api/auth'
import { UserAPI, type UserProfile } from '@/lib/api/user'
import { displayName } from '@/lib/dashboard/format'
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
  // { id: 'billing',   label: 'Plan & billing', icon: <DI.Bolt/> }, // hidden — free for now
]

export default function SettingsPage() {
  const [section, setSection] = useState('account')
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accountEmail, setAccountEmail] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reasoning, setReasoning] = useState(true)
  const [auto, setAuto] = useState(true)
  const [refresh, setRefresh] = useState(false)

  useEffect(() => {
    Promise.all([UserAPI.getProfile(), AuthAPI.getMe().catch(() => null)])
      .then(([prof, me]) => {
        setProfile(prof)
        setAccountEmail(me?.email ?? prof.email ?? '')
      })
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const name = displayName(profile?.email, profile?.display_name)

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Settings</div>
          <h1>Configure your <em>workspace</em>.</h1>
          <div className="ph-sub">Account and preferences · profile loaded from the API.</div>
        </div>
      </div>

      {error && <div className="card" style={{ marginBottom: 16, color: 'var(--warn)' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div className="card" style={{ padding: 10 }}>
          {sections.map(s => (
            <button key={s.id} className={`settings-nav-item ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading ? (
            <p style={{ color: 'var(--fg-2)' }}>Loading profile…</p>
          ) : section === 'account' ? (
            <SetCard title="Profile" desc="Loaded from GET /api/profile.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#e4a89c,#a36b58)' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: 'var(--fg)' }}>{name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{accountEmail || '—'}</div>
                </div>
              </div>
              <Field label="Display name"><input style={inp} readOnly value={profile?.display_name ?? name}/></Field>
              <Field label="Email"><input style={inp} readOnly value={accountEmail}/></Field>
              <Field label="Bio"><input style={inp} readOnly value={profile?.bio ?? ''} placeholder="Not set"/></Field>
              <Field label="Location"><input style={inp} readOnly value={profile?.location ?? ''} placeholder="Not set"/></Field>
            </SetCard>
          ) : section === 'workspace' ? (
            <SetCard title="Workspace" desc="Your personal IdeaCopilot workspace.">
              <Field label="Display name"><input style={inp} readOnly value={profile?.display_name ?? name}/></Field>
              <Field label="Username"><input style={inp} readOnly value={profile?.username ?? '—'} placeholder="Not set"/></Field>
            </SetCard>
          ) : section === 'ai' ? (
            <SetCard title="AI behavior" desc="UI preferences (not persisted to API yet).">
              <Field label="Show reasoning steps"><Toggle on={reasoning} onChange={setReasoning}/></Field>
              <Field label="Auto-refine new ideas"><Toggle on={auto} onChange={setAuto}/></Field>
              <Field label="Hourly competitor refresh"><Toggle on={refresh} onChange={setRefresh}/></Field>
            </SetCard>
          ) : section === 'notifs' ? (
            <SetCard title="Notifications" desc="Manage alerts in Notifications page.">
              <p style={{ fontSize: 13, color: 'var(--fg-2)' }}>Notification delivery uses the backend notification service.</p>
            </SetCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
