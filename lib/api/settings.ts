import { fetchWithAuth } from './http'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export const AI_PREFERENCES_KEY = 'ai.preferences'
export const NOTIFICATION_PREFERENCES_KEY = 'notifications.preferences'

export type UserSetting = {
  id: string
  setting_key: string
  setting_value: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type AiPreferences = {
  show_reasoning: boolean
  auto_refine: boolean
  competitor_refresh: boolean
}

export type NotificationPreferences = {
  market_gaps: boolean
  competitor_alerts: boolean
  ai_suggestions: boolean
  weekly_digest: boolean
}

export const DEFAULT_AI_PREFERENCES: AiPreferences = {
  show_reasoning: true,
  auto_refine: true,
  competitor_refresh: false,
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  market_gaps: true,
  competitor_alerts: true,
  ai_suggestions: true,
  weekly_digest: false,
}

function asBool(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback
}

export function parseAiPreferences(raw?: Record<string, unknown> | null): AiPreferences {
  if (!raw) return { ...DEFAULT_AI_PREFERENCES }
  return {
    show_reasoning: asBool(raw.show_reasoning, DEFAULT_AI_PREFERENCES.show_reasoning),
    auto_refine: asBool(raw.auto_refine, DEFAULT_AI_PREFERENCES.auto_refine),
    competitor_refresh: asBool(raw.competitor_refresh, DEFAULT_AI_PREFERENCES.competitor_refresh),
  }
}

export function parseNotificationPreferences(raw?: Record<string, unknown> | null): NotificationPreferences {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFERENCES }
  return {
    market_gaps: asBool(raw.market_gaps, DEFAULT_NOTIFICATION_PREFERENCES.market_gaps),
    competitor_alerts: asBool(raw.competitor_alerts, DEFAULT_NOTIFICATION_PREFERENCES.competitor_alerts),
    ai_suggestions: asBool(raw.ai_suggestions, DEFAULT_NOTIFICATION_PREFERENCES.ai_suggestions),
    weekly_digest: asBool(raw.weekly_digest, DEFAULT_NOTIFICATION_PREFERENCES.weekly_digest),
  }
}

export class SettingsAPI {
  static async list(): Promise<UserSetting[]> {
    const result = await fetchWithAuth(`${API_URL}/api/settings`)
    return Array.isArray(result.data) ? result.data : []
  }

  static async upsert(key: string, value: Record<string, unknown>): Promise<UserSetting> {
    const existing = await this.list()
    if (existing.some(s => s.setting_key === key)) {
      const result = await fetchWithAuth(`${API_URL}/api/settings/${encodeURIComponent(key)}`, {
        method: 'PUT',
        body: JSON.stringify({ setting_value: value }),
      })
      return result.data
    }
    const result = await fetchWithAuth(`${API_URL}/api/settings`, {
      method: 'POST',
      body: JSON.stringify({ setting_key: key, setting_value: value }),
    })
    return result.data
  }

  static async getAiPreferences(): Promise<AiPreferences> {
    const settings = await this.list()
    const row = settings.find(s => s.setting_key === AI_PREFERENCES_KEY)
    return parseAiPreferences(row?.setting_value)
  }

  static async saveAiPreferences(prefs: AiPreferences): Promise<AiPreferences> {
    await this.upsert(AI_PREFERENCES_KEY, prefs)
    return prefs
  }

  static async getNotificationPreferences(): Promise<NotificationPreferences> {
    const settings = await this.list()
    const row = settings.find(s => s.setting_key === NOTIFICATION_PREFERENCES_KEY)
    return parseNotificationPreferences(row?.setting_value)
  }

  static async saveNotificationPreferences(prefs: NotificationPreferences): Promise<NotificationPreferences> {
    await this.upsert(NOTIFICATION_PREFERENCES_KEY, prefs)
    return prefs
  }
}
