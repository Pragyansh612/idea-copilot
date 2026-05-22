'use client'

import { useThemeContext } from '@/components/ThemeProvider'

/** Shared theme state — persists to localStorage and `data-theme` on `<html>`. */
export function useTheme(): [string, () => void] {
  const { theme, toggleTheme } = useThemeContext()
  return [theme, toggleTheme]
}
