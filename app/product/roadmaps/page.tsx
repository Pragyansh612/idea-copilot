import ProductFeatureLayout from '@/components/product/ProductFeatureLayout'

export default function ProductRoadmapsPage() {
  return (
    <ProductFeatureLayout
      variant="roadmaps"
      eyebrow="Product · Roadmap planner"
      title={<>Phases and features with <em>rationale</em>.</>}
      description="Roadmaps live on each idea as phases and features you can complete, reorder, and track — the same model the backend uses when you ship for real."
      bullets={[
        'Phases and features on every idea detail page',
        'Toggle completion synced to the API instantly',
        'Portfolio view groups execution across ideas',
      ]}
      highlights={[
        { title: 'Phases', desc: 'Beta, launch, scale — sequenced' },
        { title: 'Features', desc: 'Check off work inside each phase' },
        { title: 'Progress', desc: 'Bars reflect real completion' },
        { title: 'Copilot', desc: 'Ask for the next milestone' },
      ]}
    />
  )
}
