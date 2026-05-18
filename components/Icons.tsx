import type { SVGProps } from 'react'

type P = SVGProps<SVGSVGElement>

export const IconArrow = (p: P) => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" {...p}>
    <path d="M3 7H11M11 7L7 3M11 7L7 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
export const IconSun = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.4"/>
    <path d="M8 1.5V3M8 13v1.5M14.5 8H13M3 8H1.5M12.6 3.4l-1 1M4.4 11.6l-1 1M12.6 12.6l-1-1M4.4 4.4l-1-1" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
  </svg>
)
export const IconMoon = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M13.5 9.5a5.5 5.5 0 1 1-7-7 4.5 4.5 0 0 0 7 7Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
  </svg>
)
export const IconCheck = (p: P) => (
  <svg viewBox="0 0 14 14" fill="none" {...p}>
    <path d="M3 7.5L6 10.5L11.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
)
export const IconCapture = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M3 3h7l3 3v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M10 3v3h3" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
)
export const IconSpark = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <path d="M8 2v3M8 11v3M2 8h3M11 8h3M4 4l2 2M10 10l2 2M12 4l-2 2M6 10l-2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
export const IconRadar = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="3" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="8" cy="8" r="0.8" fill="currentColor"/>
  </svg>
)
export const IconTarget = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M8 5v6M5 8h6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)
export const IconStack = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <rect x="2.5" y="3" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="2.5" y="7" width="11" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
    <rect x="2.5" y="11" width="11" height="2" rx="0.5" stroke="currentColor" strokeWidth="1.3"/>
  </svg>
)
export const IconRoute = (p: P) => (
  <svg viewBox="0 0 16 16" fill="none" {...p}>
    <circle cx="3" cy="3" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3"/>
    <path d="M3 4.5V8a2 2 0 0 0 2 2h6a2 2 0 0 1 2 2v-.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
  </svg>
)