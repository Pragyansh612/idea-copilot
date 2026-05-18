export default function LogoStrip() {
  return (
    <section className="logo-strip">
      <div className="wrap">
        <div className="logo-strip-label">Trusted by founders shipping at</div>
        <div className="logos">
          <div className="logo">
            <svg viewBox="0 0 90 22" fill="currentColor">
              <circle cx="11" cy="11" r="9" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="11" cy="11" r="3.5"/>
              <text x="26" y="16" fontFamily="Geist, sans-serif" fontSize="14" fontWeight="500" letterSpacing="-0.5">Northwind</text>
            </svg>
          </div>
          <div className="logo">
            <svg viewBox="0 0 100 22" fill="currentColor">
              <path d="M3 11l6-6 6 6-6 6z" fill="none" stroke="currentColor" strokeWidth="1.5"/><circle cx="9" cy="11" r="2"/>
              <text x="22" y="16" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="500" letterSpacing="3">CORTEX</text>
            </svg>
          </div>
          <div className="logo">
            <svg viewBox="0 0 80 22" fill="currentColor">
              <path d="M11 3 L19 11 L11 19 L3 11 Z" fill="currentColor"/><rect x="9" y="9" width="4" height="4" fill="var(--surface)"/>
              <text x="26" y="16" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="16" fontWeight="400">Beacon</text>
            </svg>
          </div>
          <div className="logo">
            <svg viewBox="0 0 110 22" fill="currentColor">
              <rect x="3" y="3" width="16" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M6 6 L16 16 M16 6 L6 16" stroke="currentColor" strokeWidth="1.5"/>
              <text x="26" y="16" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="500" letterSpacing="3">PARALLAX</text>
            </svg>
          </div>
          <div className="logo">
            <svg viewBox="0 0 96 22" fill="currentColor">
              <path d="M3 19 L11 3 L19 19 Z" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 14 L15 14" stroke="currentColor" strokeWidth="1.5"/>
              <text x="26" y="16" fontFamily="Instrument Serif, serif" fontStyle="italic" fontSize="16" fontWeight="400">Quill &amp; Co.</text>
            </svg>
          </div>
          <div className="logo">
            <svg viewBox="0 0 110 22" fill="currentColor">
              <circle cx="6" cy="11" r="3" fill="currentColor"/>
              <circle cx="14" cy="11" r="3" fill="none" stroke="currentColor" strokeWidth="1.5"/>
              <text x="24" y="16" fontFamily="Geist Mono, monospace" fontSize="12" fontWeight="500" letterSpacing="3">FOUNDRY 09</text>
            </svg>
          </div>
        </div>
      </div>
    </section>
  )
}