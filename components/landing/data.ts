/* ============================================================
   IdeaCopilot landing — the single worked example threaded
   through every screen: an AI customer-feedback intelligence
   platform. Ported verbatim from new_landing_page/screens.jsx.

   The cross-reference chain that proves the system is connected:
   Enterpret appears in the discovery list (73%, the top threat),
   again in the readiness/session context bar, and again inside the
   Copilot's answer. Unwrap.ai stays in an "analyzing" state the
   whole way through. The readiness score (64%) and the missing GTM
   phase surface in the checklist and get noticed by the Copilot.
   ============================================================ */

export interface Competitor {
  mark: string
  name: string
  focus: string
  stops: string
  raised: string
  overlap: number
  analyzing?: boolean
}

export const EXAMPLE: {
  idea: string
  competitors: Competitor[]
  wedge: string
} = {
  idea:
    'Turn every support ticket, app-store review, and sales call into ranked product signals — so I always know what to build next from what customers actually say.',
  competitors: [
    { mark: 'E', name: 'Enterpret', focus: 'Taxonomy-led feedback unification', stops: 'Tags every ticket — you still prioritize by hand', raised: '$28M · Series A', overlap: 73 },
    { mark: 'D', name: 'Dovetail', focus: 'Research & customer-insight repository', stops: 'A searchable library, not a decision', raised: '$63M · Series B', overlap: 66 },
    { mark: 'U', name: 'Unwrap.ai', focus: 'AI feedback clustering & anomaly alerts', stops: '', raised: '$6M · Seed', overlap: 61, analyzing: true },
    { mark: 'C', name: 'Cycle', focus: 'Feedback captured into product docs', stops: 'Captures the signal, never ranks it', raised: '$8M · Seed', overlap: 54 },
    { mark: 'P', name: 'Productboard', focus: 'Roadmapping with a feedback inbox', stops: 'A roadmap — but not one ranked by signal', raised: '$262M · Series D', overlap: 47 },
  ],
  wedge: 'feedback themes ranked and auto-linked to live roadmap phases',
}

/* Sources the scan reads, surfaced briefly one at a time */
export const SOURCES = [
  "Enterpret's changelog",
  "Dovetail's pricing page",
  "Unwrap.ai's product pages",
  "Cycle's docs & G2 reviews",
  "Productboard's release notes",
]

/* Signal sources for the hero ambient panel — two stay "reading" forever */
export const SIGNAL_SOURCES: { name: string; state: 'done' | 'reading' }[] = [
  { name: 'Support tickets', state: 'done' },
  { name: 'App-store reviews', state: 'done' },
  { name: 'Sales-call transcripts', state: 'reading' },
  { name: 'Community forum threads', state: 'done' },
  { name: 'NPS verbatims', state: 'reading' },
]

export interface ReadyItem {
  label: string
  state: 'done' | 'todo' | 'block'
  meta?: string
}

export const READY_ITEMS: ReadyItem[] = [
  { label: 'Problem clearly defined', state: 'done' },
  { label: 'Idea sharpened to a wedge', state: 'done', meta: 'Feedback themes → ranked, roadmap-linked build order' },
  { label: 'Competitors mapped', state: 'done', meta: '5 found · Enterpret leads at 73% · gap confirmed' },
  {
    label: 'Differentiation validated with real users',
    state: 'todo',
    meta: 'Nothing yet proves PMs will act on ranked themes, not just read them. Enterpret already owns “reading” at 73% — if that’s all yours does too, you’re the sixth tool in the room.',
  },
  {
    label: 'MVP scope locked to the wedge',
    state: 'todo',
    meta: 'Scope creep here rebuilds what Dovetail and Cycle already do well. Every hour on aggregation is an hour not on the ranking loop none of the five have.',
  },
  {
    label: 'Go-to-market phase sequenced',
    state: 'block',
    meta: 'Missing — and feedback tools live or die on distribution, not features. A crowded market punishes whoever ships without a way to reach product leads, and there is no plan for it here yet.',
  },
]

export interface SessionEntry {
  time: string
  label: string
  data: string
  gap?: boolean
}

export const SESSION: SessionEntry[] = [
  { time: '09:02 AM', label: 'Idea entered', data: '“AI customer feedback intelligence platform”' },
  { time: '09:03 AM', label: '5 competitors found', data: 'Enterpret · Dovetail · Unwrap.ai · Cycle · Productboard' },
  { time: '09:04 AM', label: 'One still analyzing', data: 'Unwrap.ai · scanning product pages' },
  { time: '09:05 AM', label: 'Gap confirmed', data: 'No competitor ranks themes directly to a live roadmap', gap: true },
  { time: '09:06 AM', label: 'Readiness scored', data: '64% · GTM phase missing' },
  { time: '09:08 AM', label: 'Copilot flagged it', data: '“Your roadmap has no go-to-market phase — your three main competitors all launched with one”' },
  { time: '09:09 AM', label: 'Next move locked', data: 'Validate ranked themes with 5 PMs before building' },
]

export const COP_RESPONSE =
  "Not yet — and here's the specific reason. Enterpret unifies feedback into a taxonomy, Dovetail keeps it in a searchable research repository, and Unwrap.ai clusters it into themes. Every one of them stops at organizing the feedback. Your edge — ranking those themes against a live roadmap so the next build is obvious — is the one loop none of them close. That wedge is real. ¶ But nothing in this workspace yet proves a product lead will act on ranked themes instead of just reading them — that is the validation gap your readiness score keeps flagging. And your roadmap still has no go-to-market phase: in a market this crowded, distribution decides who survives, not the feature set. ¶ So don't open the editor yet. Interview 5 heads of product this week — ask how they triage feedback today, before you write a line of code. If they won't act on ranked themes, the wedge is a feature, not a company."

export const COP_CITE = ['Enterpret', 'Dovetail', 'Unwrap.ai']

export type MatrixCell = 'yes' | 'no' | 'other' | 'plan' | 'p3'

export interface MatrixRow {
  feat: string
  you: MatrixCell
  E: MatrixCell
  D: MatrixCell
  U: MatrixCell
}

export const MATRIX_ROWS: MatrixRow[] = [
  { feat: 'Aggregates tickets, reviews & calls', you: 'yes', E: 'other', D: 'other', U: 'yes' },
  { feat: 'Auto-themes feedback with AI', you: 'yes', E: 'yes', D: 'no', U: 'other' },
  { feat: 'Links themes → roadmap phases', you: 'yes', E: 'no', D: 'no', U: 'no' },
  { feat: 'Per-theme priority scoring', you: 'plan', E: 'no', D: 'no', U: 'no' },
  { feat: 'Native CRM + support sync', you: 'p3', E: 'other', D: 'no', U: 'no' },
]
