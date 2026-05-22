import ProductFeatureLayout from '@/components/product/ProductFeatureLayout'

export default function ProductDashboardPage() {
  return (
    <ProductFeatureLayout
      variant="dashboard"
      eyebrow="Product · Dashboard"
      title={<>Your ideas, <em>one command center</em>.</>}
      description="The workspace home surfaces viability scores, active ideas, streaks, and what needs attention — pulled live from your account, not a static screenshot."
      bullets={[
        'At-a-glance stats: ideas created, level, streak, AI usage',
        'Recent ideas and notifications without digging through menus',
        'One-click paths to Copilot, competitors, and new captures',
      ]}
      highlights={[
        { title: 'Live stats', desc: 'XP, streaks, and idea counts from the API' },
        { title: 'Idea grid', desc: 'Open any project in two clicks' },
        { title: 'Signals', desc: 'Unread notifications in the sidebar' },
        { title: 'Focus', desc: 'Built for solo founders, not teams of ten' },
      ]}
    />
  )
}
