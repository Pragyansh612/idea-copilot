/** In-memory discover jobs so navigating away doesn't lose progress UI. */

export type DiscoverLog = { at: number; text: string }

export type DiscoverJobState = {
  ideaId: string
  status: 'idle' | 'running' | 'done' | 'error'
  startedAt: number | null
  finishedAt: number | null
  logs: DiscoverLog[]
  error: string | null
  resultSummary: string | null
}

type JobInternal = {
  state: DiscoverJobState
  promise: Promise<void> | null
  listeners: Set<(s: DiscoverJobState) => void>
  tick: ReturnType<typeof setInterval> | null
}

const jobs = new Map<string, JobInternal>()

const PROGRESS_HINTS = [
  'Searching the web for competitor candidates…',
  'Reading product pages and filtering noise…',
  'Scoring relevance against your idea…',
  'Extracting positioning and feature signals…',
  'Almost done — consolidating the competitor set…',
]

function emptyState(ideaId: string): DiscoverJobState {
  return {
    ideaId,
    status: 'idle',
    startedAt: null,
    finishedAt: null,
    logs: [],
    error: null,
    resultSummary: null,
  }
}

function getOrCreate(ideaId: string): JobInternal {
  let job = jobs.get(ideaId)
  if (!job) {
    job = { state: emptyState(ideaId), promise: null, listeners: new Set(), tick: null }
    jobs.set(ideaId, job)
  }
  return job
}

function emit(job: JobInternal) {
  const snapshot = { ...job.state, logs: [...job.state.logs] }
  for (const fn of job.listeners) fn(snapshot)
}

function pushLog(job: JobInternal, text: string) {
  job.state = {
    ...job.state,
    logs: [...job.state.logs, { at: Date.now(), text }].slice(-40),
  }
  emit(job)
}

function persistLite(ideaId: string, status: DiscoverJobState['status'], startedAt: number | null) {
  try {
    if (status === 'running' && startedAt) {
      sessionStorage.setItem(`ic-discover:${ideaId}`, JSON.stringify({ status, startedAt }))
    } else {
      sessionStorage.removeItem(`ic-discover:${ideaId}`)
    }
  } catch {
    /* ignore */
  }
}

export function getDiscoverJob(ideaId: string): DiscoverJobState {
  return { ...getOrCreate(ideaId).state, logs: [...getOrCreate(ideaId).state.logs] }
}

export function subscribeDiscoverJob(ideaId: string, fn: (s: DiscoverJobState) => void): () => void {
  const job = getOrCreate(ideaId)
  job.listeners.add(fn)
  fn({ ...job.state, logs: [...job.state.logs] })
  return () => {
    job.listeners.delete(fn)
  }
}

export type DiscoverRunnerResult = {
  discovered?: number
  rejected?: unknown[]
  cached?: boolean
  cache_age_days?: number | null
}

export function startDiscoverJob(
  ideaId: string,
  run: () => Promise<DiscoverRunnerResult>,
): Promise<void> {
  const job = getOrCreate(ideaId)
  if (job.state.status === 'running' && job.promise) return job.promise

  const startedAt = Date.now()
  job.state = {
    ideaId,
    status: 'running',
    startedAt,
    finishedAt: null,
    logs: [{ at: startedAt, text: 'Started competitor discovery' }],
    error: null,
    resultSummary: null,
  }
  persistLite(ideaId, 'running', startedAt)
  emit(job)

  let hintIdx = 0
  if (job.tick) clearInterval(job.tick)
  job.tick = setInterval(() => {
    if (job.state.status !== 'running') return
    pushLog(job, PROGRESS_HINTS[hintIdx % PROGRESS_HINTS.length])
    hintIdx += 1
  }, 12_000)

  job.promise = (async () => {
    try {
      pushLog(job, 'Calling discovery API (web search + page analysis)…')
      const result = await run()
      const rejectedCount = result.rejected?.length ?? 0
      let summary: string
      if (result.cached) {
        const age = result.cache_age_days
        summary =
          age != null
            ? `Cached results from ${age} day${age === 1 ? '' : 's'} ago`
            : 'Showing cached competitor results'
      } else if (rejectedCount > 0) {
        summary = `Found ${result.discovered ?? 0} competitor(s); skipped ${rejectedCount} as not relevant`
      } else {
        summary = `Discovery complete — ${result.discovered ?? 0} competitor(s) found`
      }
      if (job.tick) {
        clearInterval(job.tick)
        job.tick = null
      }
      job.state = {
        ...job.state,
        status: 'done',
        finishedAt: Date.now(),
        resultSummary: summary,
        logs: [...job.state.logs, { at: Date.now(), text: summary }],
      }
      persistLite(ideaId, 'done', null)
      emit(job)
    } catch (err) {
      if (job.tick) {
        clearInterval(job.tick)
        job.tick = null
      }
      const message = err instanceof Error ? err.message : 'Competitor discovery failed'
      job.state = {
        ...job.state,
        status: 'error',
        finishedAt: Date.now(),
        error: message,
        logs: [...job.state.logs, { at: Date.now(), text: `Error: ${message}` }],
      }
      persistLite(ideaId, 'error', null)
      emit(job)
      throw err
    } finally {
      job.promise = null
    }
  })()

  return job.promise
}

export function clearDiscoverJob(ideaId: string) {
  const job = getOrCreate(ideaId)
  if (job.tick) {
    clearInterval(job.tick)
    job.tick = null
  }
  job.state = emptyState(ideaId)
  persistLite(ideaId, 'idle', null)
  emit(job)
}
