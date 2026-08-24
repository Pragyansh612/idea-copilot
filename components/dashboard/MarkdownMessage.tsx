'use client'

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders an assistant chat message's Markdown (bold, headings, lists, links)
 * instead of showing the raw `**`/`#` syntax. User-typed messages should stay
 * plain text — only pass AI output through this. */
export function MarkdownMessage({ content }: { content: string }) {
  return (
    <div className="cp-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )
}
