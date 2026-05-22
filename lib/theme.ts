export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'ic-theme'

/** Default for React state on server and first client paint — must match layout blocking script fallback. */
export const SSR_THEME: Theme = 'dark'

export function getStoredTheme(): Theme | null {
  if (typeof window === 'undefined') return null
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return null
}

export function readDomTheme(): Theme {
  if (typeof document === 'undefined') return SSR_THEME
  const onHtml = document.documentElement.getAttribute('data-theme')
  if (onHtml === 'light' || onHtml === 'dark') return onHtml
  return SSR_THEME
}

export function getPreferredTheme(): Theme {
  if (typeof window === 'undefined') return SSR_THEME
  const stored = getStoredTheme()
  if (stored) return stored
  return readDomTheme()
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

export function subscribeTheme(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {}
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback()
  }
  const observer = new MutationObserver(callback)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  window.addEventListener('storage', onStorage)
  return () => {
    observer.disconnect()
    window.removeEventListener('storage', onStorage)
  }
}
