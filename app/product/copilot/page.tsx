import ProductFeatureLayout from '@/components/product/ProductFeatureLayout'

export default function ProductCopilotPage() {
  return (
    <ProductFeatureLayout
      variant="copilot"
      eyebrow="Product · AI Copilot"
      title={<>An AI strategist that <em>knows your ideas</em>.</>}
      description="Copilot reasons over your workspace — ideas, phases, features, and competitor research — so every answer cites your context instead of generic startup advice."
      bullets={[
        'Chat with full idea context or workspace-wide',
        'History saved on the backend for every thread',
        'Suggested prompts: scoring, MVP scope, gaps, beta plans',
      ]}
      highlights={[
        { title: 'Contextual', desc: 'Pick an idea or chat across the lab' },
        { title: 'Persistent', desc: 'Conversation history in the sidebar' },
        { title: 'Fast', desc: 'Streaming-style UX with live backend' },
        { title: 'Actionable', desc: 'Wedges, features, and sequencing' },
      ]}
    />
  )
}
