'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AuthAPI } from '@/lib/api/auth'
import { IdeaAPI } from '@/lib/api/idea'
import {
  SettingsAPI,
  DEFAULT_AI_PREFERENCES,
  DEFAULT_NOTIFICATION_PREFERENCES,
  type AiPreferences,
  type NotificationPreferences,
} from '@/lib/api/settings'
import { UserAPI, type UserProfile } from '@/lib/api/user'
import SettingsApiTokens from '@/components/dashboard/SettingsApiTokens'
import { PageError, PageLoading } from '@/components/dashboard/PageState'
import { Toast } from '@/components/dashboard/Toast'
import { displayName } from '@/lib/dashboard/format'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'
import type { ReactNode } from 'react'

function SetCard({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <div className="dash-card">
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

function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange?.(!on)}
      style={{ width: 38, height: 22, borderRadius: 999, background: on ? 'var(--accent)' : 'color-mix(in srgb, var(--fg) 8%, transparent)', position: 'relative', transition: 'background .2s', border: '1px solid var(--line-2)', cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1 }}
    >
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
] as const

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading settings…" />}>
      <SettingsContent />
    </Suspense>
  )
}

function SettingsContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sectionParam = searchParams.get('section')
  const [section, setSection] = useState<string>(
    sections.some(s => s.id === sectionParam) ? sectionParam! : 'account',
  )
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [accountEmail, setAccountEmail] = useState<string>('')
  const [ideaCount, setIdeaCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [aiPrefs, setAiPrefs] = useState<AiPreferences | null>(null)
  const [notifPrefs, setNotifPrefs] = useState<NotificationPreferences | null>(null)
  const [savingPrefs, setSavingPrefs] = useState(false)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({
    display_name: '',
    username: '',
    bio: '',
    timezone: 'UTC',
  })

  useEffect(() => {
    if (sectionParam && sections.some(s => s.id === sectionParam)) {
      setSection(sectionParam)
    }
  }, [sectionParam])

  async function loadProfile() {
    try {
      setLoading(true)
      setError(null)
      const [prof, me, ideasRes, ai, notifs] = await Promise.all([
        UserAPI.getProfile(),
        AuthAPI.getMe().catch(() => null),
        IdeaAPI.getIdeas({ limit: 1 }).catch(() => null),
        SettingsAPI.getAiPreferences().catch(() => DEFAULT_AI_PREFERENCES),
        SettingsAPI.getNotificationPreferences().catch(() => DEFAULT_NOTIFICATION_PREFERENCES),
      ])
      setProfile(prof)
      setAccountEmail(me?.email ?? prof.email ?? '')
      if (ideasRes) setIdeaCount(ideasRes.total)
      setAiPrefs(ai ?? DEFAULT_AI_PREFERENCES)
      setNotifPrefs(notifs ?? DEFAULT_NOTIFICATION_PREFERENCES)
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

  useEffect(() => { void loadProfile() }, [])

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

  async function updateAiPref(key: keyof AiPreferences, value: boolean) {
    if (!aiPrefs) return
    const next = { ...aiPrefs, [key]: value }
    setAiPrefs(next)
    try {
      setSavingPrefs(true)
      await SettingsAPI.saveAiPreferences(next)
      setSaveMessage('AI preferences saved.')
    } catch (err) {
      setAiPrefs(aiPrefs)
      setError(err instanceof Error ? err.message : 'Failed to save AI preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  async function updateNotifPref(key: keyof NotificationPreferences, value: boolean) {
    if (!notifPrefs) return
    const next = { ...notifPrefs, [key]: value }
    setNotifPrefs(next)
    try {
      setSavingPrefs(true)
      await SettingsAPI.saveNotificationPreferences(next)
      setSaveMessage('Notification preferences saved.')
    } catch (err) {
      setNotifPrefs(notifPrefs)
      setError(err instanceof Error ? err.message : 'Failed to save notification preferences')
    } finally {
      setSavingPrefs(false)
    }
  }

  const name = displayName(profile?.email, profile?.display_name)

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <div className="ph-eyebrow">Settings</div>
          <h1>Configure your <em>workspace</em>.</h1>
          <div className="ph-sub">Account and preferences synced with your workspace API.</div>
        </div>
      </div>

      {error && section !== 'tokens' && <PageError message={error} onRetry={loadProfile} />}
      {saveMessage && <Toast message={saveMessage} onDismiss={() => setSaveMessage(null)} />}

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 20, alignItems: 'flex-start' }}>
        <div className="dash-card" style={{ padding: 10 }}>
          {sections.map(s => (
            <button
              key={s.id}
              type="button"
              className={`settings-nav-item ${section === s.id ? 'active' : ''}`}
              onClick={() => {
                setSection(s.id)
                router.replace(routes.settingsSection(s.id), { scroll: false })
              }}
            >
              {s.icon}<span>{s.label}</span>
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {loading && section !== 'tokens' ? (
            <PageLoading label="Loading profile…" />
          ) : section === 'account' ? (
            <SetCard title="Profile" desc="Your account profile from the workspace API.">
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
                    <button type="button" className="btn-sm solid" onClick={() => void saveProfile()} disabled={savingProfile}>
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
            <SetCard title="Workspace" desc="Your personal IdeaCopilot workspace summary.">
              <Field label="Ideas">
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>
                  {ideaCount === null ? '—' : `${ideaCount} idea${ideaCount !== 1 ? 's' : ''}`}
                </span>
              </Field>
              <Field label="Member since">
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>
                  {profile?.created_at
                    ? new Date(profile.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
                    : '—'}
                </span>
              </Field>
              <Field label="Timezone">
                <span style={{ fontSize: 14, color: 'var(--fg)' }}>{profile?.timezone ?? 'UTC'}</span>
              </Field>
              <Field label="Achievements">
                <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.achievements)}>
                  <DI.Bolt /> View achievements
                </button>
              </Field>
              <Field label="Plan">
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '3px 9px', borderRadius: 999, background: 'color-mix(in srgb, var(--accent) 10%, transparent)', border: '1px solid var(--accent-line)', color: 'var(--accent)' }}>
                  Free
                </span>
              </Field>
            </SetCard>
          ) : section === 'tokens' ? (
            <SetCard title="API tokens" desc="Manage programmatic access to your workspace.">
              <SettingsApiTokens />
            </SetCard>
          ) : section === 'ai' ? (
            <SetCard title="AI behavior" desc="Saved to your workspace via the settings API.">
              <Field label="Show reasoning steps">
                <Toggle on={aiPrefs?.show_reasoning ?? true} onChange={v => void updateAiPref('show_reasoning', v)} disabled={savingPrefs} />
              </Field>
              <Field label="Auto-refine new ideas">
                <Toggle on={aiPrefs?.auto_refine ?? true} onChange={v => void updateAiPref('auto_refine', v)} disabled={savingPrefs} />
              </Field>
              <Field label="Hourly competitor refresh">
                <Toggle on={aiPrefs?.competitor_refresh ?? false} onChange={v => void updateAiPref('competitor_refresh', v)} disabled={savingPrefs} />
              </Field>
            </SetCard>
          ) : section === 'notifs' ? (
            <SetCard title="Notifications" desc="Control which alerts reach your inbox.">
              <Field label="Inbox">
                <button type="button" className="btn-sm ghost" onClick={() => router.push(routes.notifications)}>
                  <DI.Bell /> Open Notifications
                </button>
              </Field>
              <Field label="Market gap alerts">
                <Toggle on={notifPrefs?.market_gaps ?? true} onChange={v => void updateNotifPref('market_gaps', v)} disabled={savingPrefs} />
              </Field>
              <Field label="Competitor alerts">
                <Toggle on={notifPrefs?.competitor_alerts ?? true} onChange={v => void updateNotifPref('competitor_alerts', v)} disabled={savingPrefs} />
              </Field>
              <Field label="AI suggestions">
                <Toggle on={notifPrefs?.ai_suggestions ?? true} onChange={v => void updateNotifPref('ai_suggestions', v)} disabled={savingPrefs} />
              </Field>
              <Field label="Weekly digest">
                <Toggle on={notifPrefs?.weekly_digest ?? false} onChange={v => void updateNotifPref('weekly_digest', v)} disabled={savingPrefs} />
              </Field>
            </SetCard>
          ) : null}
        </div>
      </div>
    </div>
  )
}
