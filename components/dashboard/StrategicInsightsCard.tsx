'use client'

import type { StrategicSection } from '@/lib/dashboard/competitor-intel'
import * as DI from '@/components/dashboard/Icons'

type Props = {
  sections: StrategicSection[] | null
  loading: boolean
  onGenerate: () => void
}

export function StrategicInsightsCard({ sections, loading, onGenerate }: Props) {
  return (
    <div className="ci-strat dash-card">
      <div className="l"><DI.Sparkles /> Strategic insights</div>
      <h4>AI briefing on <em>positioning</em></h4>
      <p>Generate weaknesses, opportunities, and your fastest differentiator from live competitor context.</p>
      <button type="button" className="btn-sm solid" onClick={onGenerate} disabled={loading}>
        <DI.Spark /> {loading ? 'Generating…' : 'Generate strategic insights'}
      </button>
      {sections && sections.length > 0 && (
        <div className="ci-strat-sections">
          {sections.map(sec => (
            <div key={sec.title} className="ci-strat-block">
              <h5>{sec.title}</h5>
              <ul>
                {sec.items.map((item, i) => (
                  <li key={`${sec.title}-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
