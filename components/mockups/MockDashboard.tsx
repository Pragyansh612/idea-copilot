import * as S from './shared'

function Stat({ label, value, delta }: { label: string; value: string; delta: string }) {
  return (
    <div style={{ padding: 12, borderRadius: 10, background: 'color-mix(in srgb, var(--fg) 3%, transparent)', border: '1px solid var(--line)' }}>
      <div style={{ ...S.subLabel }}>{label}</div>
      <div style={{ fontSize: 22, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--fg)' }}>{value}</div>
      <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--accent)', marginTop: 2 }}>{delta}</div>
    </div>
  )
}

function RefineLine({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '8px 12px', borderRadius: 8, background: 'color-mix(in srgb, var(--fg) 2.5%, transparent)', border: '1px solid var(--line)' }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)', flexShrink: 0 }}>{`0${n}`}</span>
      <span style={{ fontSize: 12, color: 'var(--fg-2)', lineHeight: 1.4 }}>{text}</span>
    </div>
  )
}

export default function MockDashboard() {
  return (
    <div style={S.pane}>
      <div style={S.toolbar}>
        <div style={S.dots}><span style={S.dot}/><span style={S.dot}/><span style={S.dot}/></div>
        <span style={{ marginLeft: 8 }}>ideacopilot · workspace</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center', textTransform: 'none' }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'color-mix(in srgb, var(--fg) 6%, transparent)' }} />
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'color-mix(in srgb, var(--fg) 6%, transparent)' }} />
        </span>
      </div>
      <div style={S.body}>
        <div style={S.sidebar}>
          <div style={{ ...S.subLabel, fontSize: 9, padding: '4px 6px' }}>Ideas</div>
          <div style={S.sideItem(true)}><span style={S.sideDot('var(--accent)')} /> Hyper-local audio</div>
          <div style={S.sideItem(false)}><span style={S.sideDot('var(--good)')} /> AI grant assistant</div>
          <div style={S.sideItem(false)}><span style={S.sideDot('var(--warn)')} /> Drone logistics</div>
          <div style={S.sideItem(false)}><span style={S.sideDot('var(--fg-3)')} /> Studio for solo devs</div>
          <div style={{ ...S.subLabel, fontSize: 9, padding: '12px 6px 4px' }}>Research</div>
          <div style={S.sideItem(false)}><span style={S.sideDot('var(--accent)')} /> Competitor radar</div>
          <div style={S.sideItem(false)}><span style={S.sideDot('var(--good)')} /> Market gaps</div>
        </div>
        <div style={S.content}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <div style={S.subLabel}>Idea · drafted 2m ago</div>
              <div style={{ fontSize: 22, letterSpacing: '-0.02em', marginTop: 4, color: 'var(--fg)' }}>
                Hyper-local <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>audio</em> for neighborhoods
              </div>
            </div>
            <span style={{ padding: '4px 10px', borderRadius: 999, background: 'color-mix(in srgb, var(--good) 14%, transparent)', border: '1px solid color-mix(in srgb, var(--good) 36%, transparent)', fontSize: 10, color: 'var(--good)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>VIABLE · 87</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            <Stat label="Market size" value="$2.4B" delta="+18% YoY" />
            <Stat label="Competitors" value="14" delta="3 strong" />
            <Stat label="Gap score" value="HIGH" delta="opportunity" />
          </div>
          <div style={{ flex: 1, position: 'relative', padding: '8px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={S.subLabel}>AI refinement</div>
            <RefineLine n={1} text="Reframe as community-driven, not broadcast-driven" />
            <RefineLine n={2} text="MVP: 3-block radius, async voice notes, no profiles" />
            <RefineLine n={3} text="Anchor differentiator: hyperlocal trust + ephemerality" />
          </div>
        </div>
      </div>
    </div>
  )
}