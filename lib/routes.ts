export const routes = {
  home: '/',
  login: '/login',
  signup: '/signup',
  productDashboard: '/product/dashboard',
  productCopilot: '/product/copilot',
  productCompetitors: '/product/competitors',
  productRoadmaps: '/product/roadmaps',
  dashboard: '/dashboard',
  ideas: '/dashboard/ideas',
  ideasWithBucket: (bucket: 'ready' | 'work' | 'attention') =>
    `/dashboard/ideas?bucket=${bucket}`,
  newIdea: '/dashboard/ideas/new',
  idea: (id: string) => `/dashboard/ideas/${id}`,
  ideaTab: (id: string, tab: string, query?: Record<string, string>) => {
    const params = new URLSearchParams({ tab })
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        params.set(key, value)
      }
    }
    return `/dashboard/ideas/${id}?${params.toString()}`
  },
  ideaExport: (id: string) => `/dashboard/ideas/${id}?action=export`,
  copilot: '/dashboard/copilot',
  copilotWithDraft: '/dashboard/copilot?draft=1',
  copilotForIdea: (id: string) => `/dashboard/copilot?idea=${id}`,
  copilotDiscuss: (ideaId: string, prompt: string) =>
    `/dashboard/copilot?idea=${encodeURIComponent(ideaId)}&prompt=${encodeURIComponent(prompt)}`,
  ideaAttachments: (id: string) => `/dashboard/ideas/${id}?tab=attachments`,
  /** Unified intelligence workspace (competitors + market gaps) */
  intelligence: '/dashboard/intelligence',
  intelligenceForIdea: (id: string) => `/dashboard/intelligence?idea=${encodeURIComponent(id)}`,
  intelligenceDiscover: (id: string) =>
    `/dashboard/intelligence?idea=${encodeURIComponent(id)}&discover=1`,
  intelligenceGapAnalysis: (id: string) =>
    `/dashboard/intelligence?idea=${encodeURIComponent(id)}&gap=1`,
  intelligenceCompetitor: (ideaId: string, competitorId: string) =>
    `/dashboard/intelligence/competitors/${encodeURIComponent(competitorId)}?idea=${encodeURIComponent(ideaId)}`,
  /** @deprecated Use intelligence routes — kept for backward-compatible redirects */
  competitors: '/dashboard/intelligence',
  competitorsForIdea: (id: string) => `/dashboard/intelligence?idea=${encodeURIComponent(id)}`,
  competitorsDiscover: (id: string) =>
    `/dashboard/intelligence?idea=${encodeURIComponent(id)}&discover=1`,
  gaps: '/dashboard/intelligence',
  roadmaps: '/dashboard/roadmaps',
  notifications: '/dashboard/notifications',
  achievements: '/dashboard/achievements',
  exports: '/dashboard/exports',
  settings: '/dashboard/settings',
  settingsSection: (section: string) => `/dashboard/settings?section=${section}`,
  workflow: '/workflow',
  intel: '/intel',
  copilotSection: '/copilot',
  mockups: '/mockups',
  why: '/why',
  problem: '/problem',
  contact: '/contact',
  pricing: '/#pricing',
  cta: '/#cta',
} as const
