'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { IdeaAPI, type IdeaSearchResult } from '@/lib/api/idea'
import { routes } from '@/lib/routes'
import * as DI from '@/components/dashboard/Icons'

export function WorkspaceSearch() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<IdeaSearchResult[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)

  const runSearch = useCallback(async (q: string) => {
    const trimmed = q.trim()
    if (trimmed.length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    try {
      setLoading(true)
      const data = await IdeaAPI.searchIdeas(trimmed, 8)
      setResults(data.ideas)
      setActiveIndex(0)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const t = setTimeout(() => void runSearch(query), 280)
    return () => clearTimeout(t)
  }, [query, open, runSearch])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') {
        setOpen(false)
        inputRef.current?.blur()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  function goTo(result: IdeaSearchResult) {
    setOpen(false)
    setQuery('')
    router.push(routes.idea(result.id))
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex(i => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex(i => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[activeIndex]) {
      e.preventDefault()
      goTo(results[activeIndex])
    }
  }

  const showDropdown = open && query.trim().length >= 2

  return (
    <div className="tb-search-wrap" ref={wrapRef}>
      <div className={`tb-search ${open ? 'open' : ''}`}>
        <DI.Search />
        <input
          ref={inputRef}
          placeholder="Search ideas…"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          aria-label="Search workspace ideas"
          aria-expanded={showDropdown}
          aria-autocomplete="list"
        />
        <span className="kbd">⌘K</span>
      </div>

      {showDropdown && (
        <div className="search-dropdown" role="listbox">
          {loading ? (
            <div className="search-dropdown-empty">Searching…</div>
          ) : results.length === 0 ? (
            <div className="search-dropdown-empty">No ideas match &ldquo;{query.trim()}&rdquo;</div>
          ) : (
            results.map((r, i) => (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={i === activeIndex}
                className={`search-result ${i === activeIndex ? 'active' : ''}`}
                onMouseEnter={() => setActiveIndex(i)}
                onClick={() => goTo(r)}
              >
                <DI.Bulb />
                <div className="search-result-body">
                  <span className="search-result-title">{r.title}</span>
                  {r.description && (
                    <span className="search-result-desc">{r.description.slice(0, 80)}{r.description.length > 80 ? '…' : ''}</span>
                  )}
                </div>
                {r.status && <span className="search-result-status">{r.status}</span>}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
