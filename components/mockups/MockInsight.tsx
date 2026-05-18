import * as S from './shared'

export default function MockInsight() {
  return (
    <div style={S.pane}>
      <div style={S.toolbar}>
        <span>insight · 04:21</span>
        <span style={{ marginLeft: 'auto', color: 'var(--accent)' }}>● gap</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Market gap detected</div>
        <div style={{ fontSize: 14, lineHeight: 1.35, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
          No competitor combines <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>async voice</em> with neighborhood-level moderation.
        </div>
        <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', borderRadius: 8 }}>
          <div style={{ fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', color: 'var(--fg-2)' }}>SUGGESTED WEDGE</div>
          <div style={{ fontSize: 12, marginTop: 4, color: 'var(--fg)' }}>Apartment-block beta in dense urban areas</div>
        </div>
      </div>
    </div>
  )
}