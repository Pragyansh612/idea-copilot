import type { Metadata } from 'next'
import LandingNav from '@/components/landing/LandingNav'
import HeroSection from '@/components/landing/HeroSection'
import DiscoverySection from '@/components/landing/DiscoverySection'
import WorkspaceSection from '@/components/landing/WorkspaceSection'
import TimelineSection from '@/components/landing/TimelineSection'
import FounderSection from '@/components/landing/FounderSection'
import CloseSection from '@/components/landing/CloseSection'
import LandingFooter from '@/components/landing/LandingFooter'
import '@/app/landing.css'

export const metadata: Metadata = {
  title: 'IdeaCopilot — Know which idea to build next',
  description:
    'IdeaCopilot finds your competitors, identifies the gap they all missed, and tells you exactly what to build next.',
}

export default function Home() {
  return (
    <>
      <LandingNav />
      <main className="landing-page">
        <HeroSection />
        <DiscoverySection />
        <WorkspaceSection />
        <TimelineSection />
        <FounderSection />
        <CloseSection />
      </main>
      <LandingFooter />
    </>
  )
}