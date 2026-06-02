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
  competitors: '/dashboard/competitors',
  competitorsForIdea: (id: string) => `/dashboard/competitors?idea=${id}`,
  competitorsDiscover: (id: string) => `/dashboard/competitors?idea=${encodeURIComponent(id)}&discover=1`,
  gaps: '/dashboard/gaps',
  roadmaps: '/dashboard/roadmaps',
  notifications: '/dashboard/notifications',
  exports: '/dashboard/exports',
  settings: '/dashboard/settings',
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
