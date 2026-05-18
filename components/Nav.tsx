'use client'
import { useTheme } from '@/hooks/useTheme'
import { IconSun, IconMoon } from './Icons'

export default function Nav() {
  const [theme, toggleTheme] = useTheme()
  return (
    <nav className="nav">
      <a className="nav-logo" href="#top">
        <span className="mark" />
        <span>IdeaCopilot</span>
      </a>
      <div className="nav-links">
        <a href="#workflow">Workflow</a>
        <a href="#intel">Intelligence</a>
        <a href="#copilot">Copilot</a>
        <a href="#pricing">Pricing</a>
      </div>
      <span className="nav-sep" />
      <button
        className="nav-icon"
        onClick={toggleTheme}
        aria-label="Toggle theme"
        title={`Switch to ${theme === 'light' ? 'dark' : 'light'}`}
      >
        {theme === 'light' ? <IconMoon /> : <IconSun />}
      </button>
      <a className="nav-cta" href="#cta">Start free</a>
    </nav>
  )
}