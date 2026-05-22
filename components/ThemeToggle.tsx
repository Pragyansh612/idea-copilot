'use client'

import { useTheme } from '@/hooks/useTheme'
import { IconSun, IconMoon } from './Icons'

type ThemeToggleProps = {
  className?: string
}

/** Icon follows `data-theme` on `<html>` (set before hydration) — avoids SSR mismatch. */
export default function ThemeToggle({ className = 'nav-icon' }: ThemeToggleProps) {
  const [, toggleTheme] = useTheme()

  return (
    <button
      type="button"
      className={className}
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className="theme-toggle-icon theme-toggle-icon--moon" aria-hidden>
        <IconMoon />
      </span>
      <span className="theme-toggle-icon theme-toggle-icon--sun" aria-hidden>
        <IconSun />
      </span>
    </button>
  )
}
