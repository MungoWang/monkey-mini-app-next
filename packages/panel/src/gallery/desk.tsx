import { useLayoutEffect, useRef, useState, type ReactNode } from 'react'

/** Glass switch for the home slot. It does not write the stored id. */
export function DeskBar(props: {
  readonly label: string
  readonly choices: readonly { readonly id: string; readonly name: string }[]
  readonly selected: string
  readonly fit?: boolean
  onSelect(id: string): void
}): ReactNode {
  const row = useRef<HTMLDivElement>(null)
  const [pill, setPill] = useState<{ left: number; width: number } | undefined>(undefined)
  useLayoutEffect(() => {
    const root = row.current
    if (root === null) return
    const current = root.querySelector('[data-on="1"]')
    if (!(current instanceof HTMLElement)) return
    setPill({ left: current.offsetLeft, width: current.offsetWidth })
  }, [props.selected, props.choices])
  return (
    <div ref={row} className={props.fit === true ? 'mma-desk mma-desk-fit' : 'mma-desk'} role="tablist" aria-label={props.label}>
      {pill === undefined ? null : (
        <span className="mma-desk-pill" style={{ width: pill.width, transform: `translateX(${pill.left}px)` }} />
      )}
      {props.choices.map(choice => (
        <button
          key={choice.id}
          type="button"
          role="tab"
          className="mma-desk-item"
          data-desk={choice.id}
          data-on={choice.id === props.selected ? '1' : '0'}
          aria-selected={choice.id === props.selected}
          onClick={() => {
            if (choice.id === props.selected) return
            props.onSelect(choice.id)
          }}
        >
          {choice.name}
        </button>
      ))}
    </div>
  )
}
