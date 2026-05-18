import type { CSSProperties } from 'react'

export const pane: CSSProperties = {
  width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
  background: 'var(--surface)', color: 'var(--fg)', fontSize: 12,
}
export const toolbar: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
  borderBottom: '1px solid var(--line)', fontFamily: 'var(--font-mono)',
  fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--fg-3)',
}
export const dot: CSSProperties = { width: 8, height: 8, borderRadius: 999, background: 'color-mix(in srgb, var(--fg) 12%, transparent)' }
export const dots: CSSProperties = { display: 'flex', gap: 5 }
export const sidebar: CSSProperties = {
  width: 150, padding: '12px 10px', borderRight: '1px solid var(--line)',
  display: 'flex', flexDirection: 'column', gap: 3, background: 'var(--bg-2)',
}
export const sideItem = (active: boolean): CSSProperties => ({
  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px',
  borderRadius: 6, fontSize: 11,
  color: active ? 'var(--fg)' : 'var(--fg-2)',
  background: active ? 'var(--accent-soft)' : 'transparent',
  border: active ? '1px solid var(--accent-line)' : '1px solid transparent',
})
export const sideDot = (color: string): CSSProperties => ({
  width: 6, height: 6, borderRadius: 999, background: color, flexShrink: 0,
})
export const body: CSSProperties = { flex: 1, display: 'flex', overflow: 'hidden' }
export const content: CSSProperties = { flex: 1, padding: 18, display: 'flex', flexDirection: 'column', gap: 14, overflow: 'hidden' }
export const subLabel: CSSProperties = { fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--fg-3)', letterSpacing: '0.08em', textTransform: 'uppercase' }