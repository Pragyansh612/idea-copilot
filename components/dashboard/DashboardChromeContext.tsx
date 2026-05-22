'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type DashboardChromeContextValue = {
  ideaDetailTitle: string | null
  setIdeaDetailTitle: (title: string | null) => void
}

const DashboardChromeContext = createContext<DashboardChromeContextValue | null>(null)

export function DashboardChromeProvider({ children }: { children: ReactNode }) {
  const [ideaDetailTitle, setIdeaDetailTitle] = useState<string | null>(null)
  const value = useMemo(
    () => ({ ideaDetailTitle, setIdeaDetailTitle }),
    [ideaDetailTitle],
  )
  return (
    <DashboardChromeContext.Provider value={value}>
      {children}
    </DashboardChromeContext.Provider>
  )
}

export function useDashboardChrome() {
  const ctx = useContext(DashboardChromeContext)
  if (!ctx) {
    throw new Error('useDashboardChrome must be used within DashboardChromeProvider')
  }
  return ctx
}
