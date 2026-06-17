'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { PageLoading } from '@/components/dashboard/PageState'

function GapsRedirectInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const params = new URLSearchParams()
    const idea = searchParams.get('idea')
    if (idea) {
      params.set('idea', idea)
      params.set('gap', '1')
    }
    router.replace(`/dashboard/intelligence${params.toString() ? `?${params}` : ''}`)
  }, [router, searchParams])

  return <PageLoading label="Redirecting to Intelligence…" />
}

/** @deprecated — merged into /dashboard/intelligence */
export default function GapsRedirectPage() {
  return (
    <Suspense fallback={<PageLoading label="Redirecting…" />}>
      <GapsRedirectInner />
    </Suspense>
  )
}
