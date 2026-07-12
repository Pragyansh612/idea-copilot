/* Small local icon set used by the landing screens — ported from screens.jsx `S`. */

export const LandingIcon = {
  check: (
    <svg viewBox="0 0 14 14" fill="none"><path d="M3 7.4 6 10.3 11.4 4.2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  arrow: (
    <svg viewBox="0 0 14 14" fill="none"><path d="M3 7h8M11 7 7.4 3.4M11 7 7.4 10.6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
  ),
  pencil: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M10.5 3.2 12.8 5.5 5.4 12.9 2.8 13.4 3.3 10.8 10.5 3.2Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /></svg>
  ),
  warn: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M8 2.6 14.4 13H1.6L8 2.6Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" /><path d="M8 6.6v3.1M8 11.4h.01" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" /></svg>
  ),
  capture: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M3 3h7l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3" /><path d="M10 3v3h3" stroke="currentColor" strokeWidth="1.3" /></svg>
  ),
  spark: (
    <svg viewBox="0 0 16 16" fill="none"><path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
  ),
  radar: (
    <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3" /><circle cx="8" cy="8" r="0.9" fill="currentColor" /></svg>
  ),
  target: (
    <svg viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3" /><path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
  ),
  stack: (
    <svg viewBox="0 0 16 16" fill="none"><rect x="2.5" y="3" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /><rect x="2.5" y="7.5" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3" /></svg>
  ),
  route: (
    <svg viewBox="0 0 16 16" fill="none"><circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3" /><circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" /><path d="M3 4.5V8a2 2 0 0 0 2 2h6a2 2 0 0 1 2 2v-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" /></svg>
  ),
}

/* The chevron-arrow used on nav/CTA links — slightly different glyph than LandingIcon.arrow, ported from app.jsx `Icon.Arrow`. */
export function IconArrow(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...props}>
      <path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
