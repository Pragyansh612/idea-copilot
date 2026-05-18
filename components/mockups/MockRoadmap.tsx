import * as S from './shared'

export default function MockRoadmap() {
  const phases = [
    { name: 'Beta · 3 blocks', w: '100%' },
    { name: 'Studio launch',   w: '62%' },
    { name: 'Moderation API',  w: '28%' },
  ]
  return (
    <div style={S.pane}>
      <div style={S.toolbar}>
        <span>roadmap · Q3</span>
        <span style={{ marginLeft: 'auto' }}>3 phases</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        {phases.map((p) => (
          <div key={p.name}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: 'var(--fg)' }}>{p.name}</span>
              <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>{p.w}</span>
            </div>
            <div style={{ height: 5, background: 'color-mix(in srgb, var(--fg) 5%, transparent)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: p.w, height: '100%', background: 'var(--accent)', borderRadius: 3 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}