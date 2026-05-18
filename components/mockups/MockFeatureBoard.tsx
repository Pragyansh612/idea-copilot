export default function MockFeatureBoard() {
  const cols = [
    { name: 'Backlog',      dot: 'var(--fg-3)',   items: ['Voice-to-text caption','Block-level moderation','Anonymous mode'] },
    { name: 'In progress',  dot: 'var(--accent)',  items: ['3-block radius MVP','Async voice notes'] },
    { name: 'Shipped',      dot: 'var(--good)',    items: ['Address verification'] },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
      {cols.map((c) => (
        <div key={c.name}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: c.dot }} />
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)' }}>{c.name}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {c.items.map((it) => (
              <div key={it} style={{ padding: '10px 12px', background: 'color-mix(in srgb, var(--fg) 3%, transparent)', border: '1px solid var(--line)', borderRadius: 8, fontSize: 12, lineHeight: 1.3, color: 'var(--fg)' }}>{it}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}