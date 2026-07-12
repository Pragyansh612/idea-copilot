import type { ReactNode } from 'react'

interface AppFrameProps {
  figN: string
  cap: string
  note?: ReactNode
  className?: string
  children: ReactNode
}

/** A product screen set into the document as a numbered figure — no window chrome. */
export default function AppFrame({ figN, cap, note, className = '', children }: AppFrameProps) {
  return (
    <figure className={`plate ${className}`}>
      <div className="plate-body">{children}</div>
      <figcaption className="plate-cap">
        <span>
          <span className="n">{figN}</span> · {cap}
        </span>
        {note ? (
          <>
            <span className="sep" />
            {note}
          </>
        ) : null}
      </figcaption>
    </figure>
  )
}
