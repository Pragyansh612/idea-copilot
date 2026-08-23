'use client'

import type { StrategicAnalysis } from '@/lib/dashboard/competitor-intel'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  analysis: StrategicAnalysis | null
  loading: boolean
  onGenerate: () => void
  onDiscoverCompetitors?: () => void
}

const POSITION_LABEL: Record<StrategicAnalysis['overall_position'], string> = {
  strong: 'Strong position',
  competitive: 'Competitive',
  at_risk: 'At risk',
  unknown: 'Not enough data',
}

export function StrategicInsightsCard({ analysis, loading, onGenerate, onDiscoverCompetitors }: Props) {
  return (
    <div className="ci-strat dash-card">
      <div className="l"><DI.Sparkles /> Strategic insights</div>
      <h4>AI briefing on <em>positioning</em></h4>
      <p>Generate weaknesses, opportunities, and your fastest differentiator from live competitor context.</p>
      <button type="button" className="btn-sm solid" onClick={onGenerate} disabled={loading}>
        <DI.Spark /> {loading ? 'Generating…' : 'Generate strategic insights'}
      </button>

      {analysis && analysis.message && (
        <div className="dash-card" style={{ marginTop: 14, borderColor: 'color-mix(in srgb, var(--warn) 40%, var(--line))' }}>
          <p style={{ color: 'var(--fg)', fontSize: 13.5, margin: 0 }}>{analysis.message}</p>
          {onDiscoverCompetitors && (
            <button type="button" className="btn-sm solid" onClick={onDiscoverCompetitors} style={{ marginTop: 10 }}>
              <DI.Radar /> Discover competitors
            </button>
          )}
        </div>
      )}

      {analysis && !analysis.message && analysis.confidence === 'medium' && analysis.confidence_reason && (
        <p style={{ color: 'var(--fg-3)', fontSize: 12.5, marginTop: 10 }}>{analysis.confidence_reason}</p>
      )}

      {analysis && !analysis.message && (
        <div className="ci-strat-sections">
          <div className="ci-strat-block">
            <span className={`i-tag ${analysis.overall_position === 'strong' ? 'hot' : analysis.overall_position === 'at_risk' ? 'warn' : ''}`}>
              {POSITION_LABEL[analysis.overall_position]}
            </span>
            {analysis.summary && (
              <p style={{ color: 'var(--fg-2)', fontSize: 13, marginTop: 8, lineHeight: 1.55 }}>{analysis.summary}</p>
            )}
          </div>

          {analysis.fastest_differentiator && (
            <div className="ci-strat-block">
              <h5>Fastest differentiator</h5>
              <p style={{ color: 'var(--fg-2)', fontSize: 13, lineHeight: 1.55 }}>{analysis.fastest_differentiator}</p>
            </div>
          )}

          {analysis.your_strengths.length > 0 && (
            <div className="ci-strat-block">
              <h5>Your strengths</h5>
              <ul>{analysis.your_strengths.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {analysis.your_weaknesses.length > 0 && (
            <div className="ci-strat-block">
              <h5>Your weaknesses</h5>
              <ul>{analysis.your_weaknesses.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}

          {analysis.competitor_weaknesses.length > 0 && (
            <div className="ci-strat-block">
              <h5>Competitor weaknesses</h5>
              <ul>
                {analysis.competitor_weaknesses.map((c, i) => (
                  <li key={i}>
                    <strong>{c.competitor_name}:</strong> {c.weakness}
                    {c.opportunity ? ` — ${c.opportunity}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.feature_gaps.length > 0 && (
            <div className="ci-strat-block">
              <h5>Feature gaps</h5>
              <ul>
                {analysis.feature_gaps.map((g, i) => (
                  <li key={i}>
                    {g.feature}
                    {g.description ? ` — ${g.description}` : ''}
                    {g.competitor_count ? ` (${g.competitor_count} competitors have this)` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysis.strategy_advice.length > 0 && (
            <div className="ci-strat-block">
              <h5>Strategy recommendations</h5>
              <ul>{analysis.strategy_advice.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
