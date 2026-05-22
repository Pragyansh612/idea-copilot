import ProductFeatureLayout from '@/components/product/ProductFeatureLayout'

export default function ProductCompetitorsPage() {
  return (
    <ProductFeatureLayout
      variant="competitors"
      eyebrow="Product · Competitor radar"
      title={<>Map the market <em>per idea</em>.</>}
      description="Attach competitor research to each idea. Compare positioning, funding signals, and confidence scores — then run market-gap analysis on the same data."
      bullets={[
        'Competitor table per idea from your live API',
        'Scrape and analyze URLs from the backend',
        'Pair with gap detection for white-space opportunities',
      ]}
      highlights={[
        { title: 'Per-idea', desc: 'Research stays tied to one wedge' },
        { title: 'Scores', desc: 'Confidence bars per competitor' },
        { title: 'Live', desc: 'Refresh when the landscape moves' },
        { title: 'Gaps', desc: 'Jump to market-gap analysis next' },
      ]}
    />
  )
}
