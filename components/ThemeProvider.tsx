'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import {
  applyTheme,
  getPreferredTheme,
  readDomTheme,
  subscribeTheme,
  SSR_THEME,
  type Theme,
} from '@/lib/theme'

type ThemeContextValue = {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function getServerSnapshot(): Theme {
  return SSR_THEME
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribeTheme, readDomTheme, getServerSnapshot)

  const setTheme = useCallback((next: Theme) => {
    applyTheme(next)
  }, [])

  const toggleTheme = useCallback(() => {
    const next = readDomTheme() === 'light' ? 'dark' : 'light'
    applyTheme(next)
  }, [])

  const value = useMemo(
    () => ({ theme, toggleTheme, setTheme }),
    [theme, toggleTheme, setTheme],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useThemeContext must be used within ThemeProvider')
  }
  return ctx
}

/** One-time sync if blocking script and storage diverged (client-only). */
export function syncThemeFromStorage(): void {
  if (typeof window === 'undefined') return
  const preferred = getPreferredTheme()
  if (readDomTheme() !== preferred) applyTheme(preferred)
}
