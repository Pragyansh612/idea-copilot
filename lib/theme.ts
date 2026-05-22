export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ic-theme'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return null
}

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark'
  const stored = getStoredTheme()
  if (stored) return stored
  const onHtml = document.documentElement.getAttribute('data-theme')
  if (onHtml === 'light' || onHtml === 'dark') return onHtml
  return window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function applyTheme(theme: Theme): void {
  if (typeof document === 'undefined') return
  document.documentElement.setAttribute('data-theme', theme)
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // ignore
  }
}

/** Default for React state on server and first client paint — must match layout blocking script fallback. */
export const SSR_THEME: Theme = 'dark'
