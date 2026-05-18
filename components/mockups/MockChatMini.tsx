import * as S from './shared'

export default function MockChatMini() {
  return (
    <div style={S.pane}>
      <div style={S.toolbar}>
        <span style={{ width: 14, height: 14, borderRadius: 4, background: 'var(--accent)' }} />
        <span>copilot</span>
        <span style={{ marginLeft: 'auto', fontSize: 9 }}>⌘ K</span>
      </div>
      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
        <div style={{ alignSelf: 'flex-end', maxWidth: '88%', padding: '8px 12px', borderRadius: 10, background: 'var(--accent-soft)', border: '1px solid var(--accent-line)', fontSize: 11.5, color: 'var(--fg)' }}>
          Find an underserved wedge.
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <span style={{ width: 18, height: 18, borderRadius: 5, background: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
          <div style={{ padding: '8px 12px', borderRadius: 10, background: 'color-mix(in srgb, var(--fg) 4%, transparent)', border: '1px solid var(--line)', fontSize: 11.5, lineHeight: 1.4, color: 'var(--fg)' }}>
            14 competitors mapped. The gap sits between <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>trust</em> and <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>ephemerality</em>.
          </div>
        </div>
      </div>
    </div>
  )
}