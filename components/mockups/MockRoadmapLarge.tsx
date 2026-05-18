export default function MockRoadmapLarge() {
  const phases = [
    { name: 'Validate',       desc: '12 interviews · 3 wedges',        w: '100%' },
    { name: 'Prototype',      desc: 'Voice memo MVP · 3-block radius',  w: '76%' },
    { name: 'Closed beta',    desc: '200 users · 4 neighborhoods',      w: '44%' },
    { name: 'Studio launch',  desc: 'Self-serve onboarding',            w: '20%' },
    { name: 'Moderation API', desc: 'Trust + safety primitives',        w: '8%' },
  ]
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {phases.map((p, i) => (
        <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 10, background: 'color-mix(in srgb, var(--fg) 2.5%, transparent)', border: '1px solid var(--line)' }}>
          <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg-2)' }}>{`0${i + 1}`}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, letterSpacing: '-0.01em', color: 'var(--fg)' }}>{p.name}</div>
            <div style={{ fontSize: 11, color: 'var(--fg-3)' }}>{p.desc}</div>
          </div>
          <div style={{ flex: '0 0 140px', height: 4, background: 'color-mix(in srgb, var(--fg) 6%, transparent)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{ width: p.w, height: '100%', background: 'var(--accent)' }} />
          </div>
        </div>
      ))}
    </div>
  )
}