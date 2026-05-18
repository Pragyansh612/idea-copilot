'use client'
import { useState, useEffect } from 'react'

export function useTheme(): [string, () => void] {
  const [theme, setTheme] = useState<string>('dark')

  useEffect(() => {
    const saved = localStorage.getItem('ic-theme')
    if (saved === 'light' || saved === 'dark') {
      setTheme(saved)
    } else {
      setTheme(window.matchMedia?.('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('ic-theme', theme)
  }, [theme])

  return [theme, () => setTheme(t => (t === 'light' ? 'dark' : 'light'))]
}