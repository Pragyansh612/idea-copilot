import Nav from '@/components/Nav'
import Hero from '@/components/Hero'
import LogoStrip from '@/components/LogoStrip'
import ProblemSection from '@/components/ProblemSection'
import WorkflowSection from '@/components/WorkflowSection'
import IntelSection from '@/components/IntelSection'
import CopilotSection from '@/components/CopilotSection'
import MockupsSection from '@/components/MockupsSection'
import WhySection from '@/components/WhySection'
import TestimonialsSection from '@/components/TestimonialsSection'
// import PricingSection from '@/components/PricingSection' // hidden — free for now
import FinalCTA from '@/components/FinalCTA'
import Footer from '@/components/Footer'

export default function Home() {
  return (
    <>
      <Nav />
      <Hero />
      <LogoStrip />
      <ProblemSection />
      <WorkflowSection />
      <IntelSection />
      <CopilotSection />
      <MockupsSection />
      <WhySection />
      <TestimonialsSection />
      {/* <PricingSection /> */}
      <FinalCTA />
      <Footer />
    </>
  )
}