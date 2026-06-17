'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLoading } from '@/components/dashboard/PageState'

function CompetitorsRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    const idea = searchParams.get('idea')
    const discover = searchParams.get('discover')
    if (idea) params.set('idea', idea)
    if (discover) params.set('discover', discover)
    router.replace(`/dashboard/intelligence${params.toString() ? `?${params}` : ''}`)
  }, [router, searchParams])

  return <PageLoading label="Redirecting to Intelligence…" />
}

/** @deprecated — merged into /dashboard/intelligence */
export default function CompetitorsRedirectPage() {
  return (
    <Suspense fallback={<PageLoading label="Redirecting…" />}>
      <CompetitorsRedirectInner />
    </Suspense>
  )
}
