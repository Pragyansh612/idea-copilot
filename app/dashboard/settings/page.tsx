'use client'
import { useEffect, useState } from 'react'
import { AuthAPI } from '@/lib/api/auth'
import { UserAPI, type UserProfile } from '@/lib/api/user'
import SettingsApiTokens from '@/components/dashboard/SettingsApiTokens'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { Toast } from '@/components/dashboard/Toast'
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
  { id: 'tokens',    label: 'API tokens',     icon: <DI.Bolt/> },
  { id: 'ai',        label: 'AI preferences', icon: <DI.Sparkles/> },
  { id: 'notifs',    label: 'Notifications',  icon: <DI.Bell/> },
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
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    timezone: 'UTC',
  })

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)
      const [prof, me] = await Promise.all([
        UserAPI.getProfile(),
        AuthAPI.getMe().catch(() => null),
      ])
      setProfile(prof)
      setAccountEmail(me?.email ?? prof.email ?? '')
      setProfileForm({
        display_name: prof.display_name ?? '',
        username: prof.username ?? '',
        bio: prof.bio ?? '',
        timezone: prof.timezone ?? 'UTC',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfile()
  }, [])

  async function saveProfile() {
    try {
      setSavingProfile(true)
      setError(null)
      const updated = await UserAPI.updateProfile({
        display_name: profileForm.display_name || undefined,
        username: profileForm.username || undefined,
        bio: profileForm.bio || undefined,
        timezone: profileForm.timezone || undefined,
      })
      setProfile(updated)
      setEditingProfile(false)
      setSaveMessage('Profile updated successfully.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile')
    } finally {
      setSavingProfile(false)
    }
  }

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

      {error && section !== 'tokens' && <PageError message={error} onRetry={loadProfile} />}
      {saveMessage && <Toast message={saveMessage} onDismiss={() => setSaveMessage(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div className="dash-card" style={{ padding: 10 }}>
          {sections.map(s => (
            <button key={s.id} className={`settings-nav-item ${section === s.id ? 'active' : ''}`} onClick={() => setSection(s.id)}>
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading && section !== 'tokens' ? (
            <PageLoading label="Loading profile…" />
          ) : section === 'account' ? (
            <SetCard title="Profile" desc="Loaded from GET /api/profile.">
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 16, borderBottom: '1px solid var(--line)' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'linear-gradient(135deg,#e4a89c,#a36b58)' }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, color: 'var(--fg)' }}>{name}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-3)', marginTop: 2 }}>{accountEmail || '—'}</div>
                </div>
              </div>
              <Field label="Email"><input style={inp} readOnly value={accountEmail}/></Field>
              <Field label="Display name">
                <input
                  style={inp}
                  readOnly={!editingProfile}
                  value={editingProfile ? profileForm.display_name : (profile?.display_name ?? name)}
                  onChange={e => setProfileForm(prev => ({ ...prev, display_name: e.target.value }))}
                />
              </Field>
              <Field label="Username">
                <input
                  style={inp}
                  readOnly={!editingProfile}
                  value={editingProfile ? profileForm.username : (profile?.username ?? '')}
                  onChange={e => setProfileForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Not set"
                />
              </Field>
              <Field label="Bio">
                <textarea
                  style={{ ...inp, minHeight: 80, resize: 'vertical' }}
                  readOnly={!editingProfile}
                  value={editingProfile ? profileForm.bio : (profile?.bio ?? '')}
                  onChange={e => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Not set"
                />
              </Field>
              <Field label="Timezone">
                <input
                  style={inp}
                  readOnly={!editingProfile}
                  value={editingProfile ? profileForm.timezone : (profile?.timezone ?? 'UTC')}
                  onChange={e => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                />
              </Field>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 12 }}>
                {editingProfile ? (
                  <>
                    <button type="button" className="btn-sm ghost" onClick={() => setEditingProfile(false)} disabled={savingProfile}>
                      Cancel
                    </button>
                    <button type="button" className="btn-sm solid" onClick={saveProfile} disabled={savingProfile}>
                      {savingProfile ? 'Saving…' : 'Save profile'}
                    </button>
                  </>
                ) : (
                  <button type="button" className="btn-sm solid" onClick={() => setEditingProfile(true)}>
                    Edit profile
                  </button>
                )}
              </div>
            </SetCard>
          ) : section === 'workspace' ? (
            <SetCard title="Workspace" desc="Your personal IdeaCopilot workspace.">
              <Field label="Display name"><input style={inp} readOnly value={profile?.display_name ?? name}/></Field>
              <Field label="Username"><input style={inp} readOnly value={profile?.username ?? '—'} placeholder="Not set"/></Field>
            </SetCard>
          ) : section === 'tokens' ? (
            <SetCard title="API tokens" desc="Manage programmatic access to your workspace.">
              <SettingsApiTokens />
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
