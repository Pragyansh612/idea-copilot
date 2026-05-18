export default function MockStrategyCard() {
  return (
    <div style={{ padding: 18, borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-soft), transparent 70%)', border: '1px solid var(--accent-line)', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'relative' }}>
        <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>Strategy · positioning</div>
        <div style={{ fontSize: 16, marginTop: 8, lineHeight: 1.4, letterSpacing: '-0.01em', color: 'var(--fg)' }}>
          Lead with <em style={{ fontFamily: 'var(--font-serif)', color: 'var(--accent)' }}>trust + ephemerality</em>. The &ldquo;Snapchat for blocks&rdquo; framing is the strongest wedge.
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 14, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)' }}>
          <div><span>confidence </span><span style={{ color: 'var(--fg)' }}>92%</span></div>
          <div><span>signal </span><span style={{ color: 'var(--good)' }}>HIGH</span></div>
        </div>
      </div>
    </div>
  )
}