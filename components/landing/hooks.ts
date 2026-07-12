'use client'

import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Fires the moment any part of the element is in the viewport. Checked on
 * mount so anything already visible (the hero demo) starts with no delay,
 * then again on scroll — a robust fallback for environments that never
 * deliver the initial IntersectionObserver callback.
 */
export function useInView(opts?: IntersectionObserverInit): [RefObject<HTMLDivElement | null>, boolean] {
  const ref = useRef<HTMLDivElement | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const inView = () => {
      const r = el.getBoundingClientRect()
      return r.top < (window.innerHeight || document.documentElement.clientHeight) && r.bottom > 0
    }

    if (inView()) {
      setSeen(true)
      return
    }

    let io: IntersectionObserver | null = null
    const cleanup = () => {
      if (io) {
        io.disconnect()
        io = null
      }
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
    const onScroll = () => {
      if (inView()) {
        setSeen(true)
        cleanup()
      }
    }

    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setSeen(true)
            cleanup()
          }
        })
      }, { threshold: 0.3, ...(opts || {}) })
      io.observe(el)
    }

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return [ref, seen]
}

export function usePrefersReducedMotion(): boolean {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const m = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)')
    if (!m) return
    setReduce(m.matches)
    const h = (e: MediaQueryListEvent) => setReduce(e.matches)
    if (m.addEventListener) m.addEventListener('change', h)
    else m.addListener(h)
    return () => {
      if (m.removeEventListener) m.removeEventListener('change', h)
      else m.removeListener(h)
    }
  }, [])
  return reduce
}
