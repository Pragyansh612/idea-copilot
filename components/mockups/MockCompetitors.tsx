import * as S from './shared'

export default function MockCompetitors() {
  const rows = [
    { name: 'Notable',  tag: 'PROD-MKT', pos: 'Note-first',   score: 72 },
    { name: 'FieldKit', tag: 'FOUNDER',  pos: 'Mobile-first', score: 58 },
    { name: 'Brieflab', tag: 'RSRCH',    pos: 'Validation',   score: 81 },
  ]
  return (
    <div style={S.pane}>
      <div style={S.toolbar}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--good)' }} />
        <span>competitor radar · live</span>
      </div>
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
        {rows.map((r) => (
          <div key={r.name} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 9, borderRadius: 8, background: 'color-mix(in srgb, var(--fg) 2.5%, transparent)', border: '1px solid var(--line)' }}>
            <span style={{ width: 26, height: 26, borderRadius: 7, background: 'var(--bg-2)', border: '1px solid var(--line-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--fg)', fontWeight: 500 }}>{r.name[0]}</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: 'var(--fg)' }}>{r.name}</div>
              <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', color: 'var(--fg-3)' }}>{r.tag} · {r.pos}</div>
            </div>
            <div style={{ width: 44, height: 3, background: 'color-mix(in srgb, var(--fg) 6%, transparent)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: `${r.score}%`, height: '100%', background: 'var(--accent)', borderRadius: 2 }} />
            </div>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--fg-2)' }}>{r.score}</span>
          </div>
        ))}
      </div>
    </div>
  )
}