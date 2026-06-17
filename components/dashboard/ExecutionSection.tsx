'use client'

import { useEffect, useMemo, useState } from 'react'
import { CopilotAPI } from '@/lib/api/copilot'
import type { Feature, Idea, Phase } from '@/lib/api/idea'
import { buildPriorityRows } from '@/lib/dashboard/build-priority'
import {
  buildFounderReportPrompt,
  loadFounderReport,
  parseFounderReport,
  saveFounderReport,
  type FounderReport,
  type FounderReportSectionKey,
} from '@/lib/dashboard/founder-report'
import {
  LAUNCH_CHECKLIST_ITEMS,
  launchChecklistProgress,
  loadLaunchChecklist,
  toggleLaunchChecklistItem,
} from '@/lib/dashboard/launch-checklist'
import { priorityShort } from '@/lib/dashboard/format'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  ideaId: string
  idea: Idea
  features: Feature[]
  phases: Phase[]
  competitorCount: number
  onError?: (message: string) => void
}

const SWOT_KEYS: FounderReportSectionKey[] = [
  'strengths',
  'weaknesses',
  'opportunities',
  'threats',
]

const SWOT_TONE: Record<FounderReportSectionKey, string> = {
  strengths: 'exec-swot--good',
  weaknesses: 'exec-swot--warn',
  opportunities: 'exec-swot--accent',
  threats: 'exec-swot--muted',
  build_scope: 'exec-build-scope',
}

export function ExecutionSection({
  ideaId,
  idea,
  features,
  phases,
  competitorCount,
  onError,
}: Props) {
  const [report, setReport] = useState<FounderReport | null>(null)
  const [generatingReport, setGeneratingReport] = useState(false)
  const [checklist, setChecklist] = useState<Record<string, boolean>>({})

  useEffect(() => {
    setReport(loadFounderReport(ideaId))
    setChecklist(loadLaunchChecklist(ideaId))
  }, [ideaId])

  const buildRows = useMemo(
    () => buildPriorityRows(features, phases),
    [features, phases],
  )

  const launchProgress = useMemo(
    () => launchChecklistProgress(checklist),
    [checklist],
  )

  const reportByKey = useMemo(() => {
    const map = new Map<FounderReportSectionKey, string[]>()
    if (!report) return map
    for (const section of report.sections) {
      map.set(section.key, section.items)
    }
    return map
  }, [report])

  async function generateFounderReport() {
    try {
      setGeneratingReport(true)
      const prompt = buildFounderReportPrompt(idea, features, phases, competitorCount)
      const res = await CopilotAPI.chat({ query: prompt, idea_id: ideaId })
      const sections = parseFounderReport(res.response)
      const next: FounderReport = {
        sections,
        generatedAt: new Date().toISOString(),
      }
      setReport(next)
      saveFounderReport(ideaId, next)
    } catch (err) {
      onError?.(err instanceof Error ? err.message : 'Failed to generate founder report')
    } finally {
      setGeneratingReport(false)
    }
  }

  function handleChecklistToggle(itemId: string) {
    setChecklist(prev => toggleLaunchChecklistItem(ideaId, itemId, prev))
  }

  const buildScopeItems = reportByKey.get('build_scope') ?? []

  return (
    <div className="dash-card execution-section" id="execution-section">
      <div className="execution-head">
        <div>
          <div className="eyebrow-mono execution-eyebrow">Execution mode · 100% ready</div>
          <h2 className="execution-title">You&apos;re validated — <em>now build</em>.</h2>
          <p className="execution-sub">
            Shift from validation to execution: founder report, build order, and launch checklist.
          </p>
        </div>
        <span className="execution-ready-badge"><DI.Check /> Launch-ready</span>
      </div>

      <div className="execution-block">
        <div className="execution-block-head">
          <div>
            <h3>Founder Report</h3>
            <p>SWOT analysis and recommended first build scope from Copilot.</p>
          </div>
          <button
            type="button"
            className="btn-sm solid"
            onClick={() => void generateFounderReport()}
            disabled={generatingReport}
          >
            <DI.Doc /> {generatingReport ? 'Generating…' : report ? 'Regenerate report' : 'Generate Founder Report'}
          </button>
        </div>

        {generatingReport && (
          <div className="execution-loading">
            <div className="spin-ring" />
            <p>Copilot is drafting your founder report…</p>
          </div>
        )}

        {!generatingReport && !report && (
          <p className="execution-empty">One click produces strengths, weaknesses, opportunities, threats, and MVP scope.</p>
        )}

        {!generatingReport && report && (
          <>
            <p className="execution-report-meta">
              Generated {new Date(report.generatedAt).toLocaleString()}
            </p>
            <div className="exec-swot-grid">
              {SWOT_KEYS.map(key => {
                const items = reportByKey.get(key) ?? []
                return (
                  <div key={key} className={`exec-swot-card ${SWOT_TONE[key]}`}>
                    <h4>{key === 'strengths' ? 'Strengths' : key === 'weaknesses' ? 'Weaknesses' : key === 'opportunities' ? 'Opportunities' : 'Threats'}</h4>
                    {items.length === 0 ? (
                      <p className="exec-swot-empty">No items parsed.</p>
                    ) : (
                      <ul>
                        {items.map((item, i) => (
                          <li key={`${key}-${i}`}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )
              })}
            </div>
            <div className="exec-build-scope-card">
              <h4><DI.Route /> Recommended first build scope</h4>
              {buildScopeItems.length === 0 ? (
                <p className="exec-swot-empty">Regenerate if build scope is missing.</p>
              ) : (
                <ul>
                  {buildScopeItems.map((item, i) => (
                    <li key={`scope-${i}`}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}
      </div>

      <div className="execution-block">
        <div className="execution-block-head">
          <div>
            <h3>Build priority</h3>
            <p>Features and phases ranked by impact — start at the top.</p>
          </div>
        </div>
        {buildRows.length === 0 ? (
          <p className="execution-empty">Add features or roadmap phases to see a build order.</p>
        ) : (
          <div className="exec-build-list">
            {buildRows.map(row => (
              <div key={row.id} className="exec-build-row">
                <span className="exec-build-rank">{row.rank}</span>
                <div className="exec-build-body">
                  <div className="exec-build-title-row">
                    <span className={`exec-build-kind ${row.kind}`}>
                      {row.kind === 'phase' ? 'Phase' : 'Feature'}
                    </span>
                    <span className="exec-build-title">{row.title}</span>
                    {row.priority && (
                      <span className={`prio ${row.priority}`}>{priorityShort(row.priority)}</span>
                    )}
                  </div>
                  {row.subtitle && <span className="exec-build-sub">{row.subtitle}</span>}
                </div>
                <div className="exec-build-impact">
                  <span className="exec-build-impact-label">Impact</span>
                  <div className="exec-build-impact-bar">
                    <div className="fill" style={{ width: `${row.impactScore}%` }} />
                  </div>
                  <span className="exec-build-impact-val">{row.impactScore}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="execution-block">
        <div className="execution-block-head">
          <div>
            <h3>Launch checklist</h3>
            <p>Manual checks before you ship — tick each when decided.</p>
          </div>
          <span className="exec-launch-progress">
            {launchProgress.done}/{launchProgress.total} complete
          </span>
        </div>
        <div className="exec-launch-list">
          {LAUNCH_CHECKLIST_ITEMS.map(item => {
            const checked = Boolean(checklist[item.id])
            return (
              <label key={item.id} className={`exec-launch-row ${checked ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => handleChecklistToggle(item.id)}
                />
                <span className="exec-launch-check">{checked ? <DI.Check /> : null}</span>
                <span className="exec-launch-label">{item.label}</span>
              </label>
            )
          })}
        </div>
      </div>
    </div>
  )
}
