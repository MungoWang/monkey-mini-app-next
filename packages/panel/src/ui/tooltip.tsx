import type { ReactNode } from 'react'

/**
 * Fast hover/focus hint. Native `title` is slow and easy to miss on icon chrome.
 * @param props - hint text, the control, and optional alignment
 */
export function Tooltip(props: {
  readonly text: string
  readonly children: ReactNode
  readonly align?: 'center' | 'end'
  readonly className?: string
}): ReactNode {
  return (
    <span className={props.className === undefined ? 'mma-tip' : `mma-tip ${props.className}`} data-align={props.align ?? 'center'}>
      {props.children}
      <span className="mma-tip-label" role="tooltip">{props.text}</span>
    </span>
  )
}
