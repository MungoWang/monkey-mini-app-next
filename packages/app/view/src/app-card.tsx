import type { CSSProperties, ReactNode } from 'react'
import { assertNever } from '@mohou/values'
import type { AppListItem } from '@mohou/contract'

/** Card styles. The same six the panel library offers. */
export const appCardStyles = ['glass', 'stamp', 'etch', 'hero', 'pulse', 'list'] as const

export type AppCardStyle = (typeof appCardStyles)[number]

/** Fields only some styles read. Glass uses `featured` to span two columns. */
export interface AppCardExtra {
  readonly featured?: boolean
}

interface DrawnCard {
  readonly app: AppListItem
  readonly hue: CSSProperties
  readonly open: boolean
  readonly openLabel?: string
  readonly onOpen: () => void
}

/**
 * One app card. `onOpen` is the click. The card does not open the app itself.
 * @param props - style, the list item, and the open mark
 */
export function AppCard(props: {
  readonly type: AppCardStyle
  readonly app: AppListItem
  readonly open?: boolean
  readonly openLabel?: string
  readonly extra?: AppCardExtra
  readonly onOpen: () => void
}): ReactNode {
  const hue = { '--h': appCardHue(props.app.id) } as CSSProperties
  const open = props.open === true
  const label = props.openLabel === undefined ? {} : { openLabel: props.openLabel }
  const drawn = { app: props.app, hue, open, ...label, onOpen: () => { props.onOpen() } }
  switch (props.type) {
    case 'pulse':
      return <PulseCard app={props.app} hue={hue} onOpen={drawn.onOpen} />
    case 'list':
      return <ListCard {...drawn} />
    case 'glass':
      return <GlassCard {...drawn} featured={props.extra?.featured === true} />
    case 'hero':
      return <HeroCard {...drawn} />
    case 'etch':
      return <EtchCard {...drawn} />
    case 'stamp':
      return <StampCard {...drawn} />
    default:
      return assertNever(props.type, 'AppCard')
  }
}

function appCardHue(id: string): number {
  let hue = 0
  for (let index = 0; index < id.length; index += 1) hue = (hue * 31 + id.charCodeAt(index)) % 360
  return hue
}

function OpenMark(props: { readonly open: boolean; readonly openLabel: string | undefined }): ReactNode {
  if (!props.open || props.openLabel === undefined) return null
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
      <i />
      {props.openLabel}
    </span>
  )
}

function PulseCard(props: {
  readonly app: AppListItem
  readonly hue: CSSProperties
  readonly onOpen: () => void
}): ReactNode {
  return (
    <button
      type="button"
      className="relative flex w-full flex-col items-start rounded-[22px] px-[15px] pt-4 pb-[13px] pr-8 text-left"
      data-app-id={props.app.id}
      data-card="pulse"
      style={props.hue}
      onClick={props.onOpen}
    >
      <span className="pulse-dot" aria-hidden />
      <span className="pulse-mark relative z-[1] mb-2 text-[28px] leading-none font-extrabold tracking-wide">
        {props.app.acronym}
      </span>
      <h3 className="relative z-[1] m-0 text-sm font-semibold tracking-tight">{props.app.name}</h3>
      <p className="mma-copy relative z-[1] m-0 mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
        {props.app.description}
      </p>
      <span className="relative z-[1] mt-2 text-[11px] text-muted-foreground">{props.app.version}</span>
    </button>
  )
}

function ListCard(props: DrawnCard): ReactNode {
  return (
    <button
      type="button"
      className="relative flex h-24 w-full items-stretch gap-2 overflow-hidden rounded-2xl border border-foreground/10 bg-card p-2 text-left"
      data-app-id={props.app.id}
      data-card="list"
      style={props.hue}
      onClick={props.onOpen}
    >
      <span aria-hidden className="list-backlight" />
      <span aria-hidden className="list-wash" />
      <span aria-hidden className="list-orb" />
      <span className="relative z-[1] flex min-w-0 flex-1 flex-col justify-between rounded-xl bg-card/50 px-3 py-2 backdrop-blur-md">
        <span className="truncate text-sm font-semibold">{props.app.name}</span>
        <span className="truncate text-xs text-muted-foreground">{props.app.description}</span>
        <span className="text-[11px] text-muted-foreground">
          {props.open ? <OpenMark open={props.open} openLabel={props.openLabel} /> : props.app.version}
        </span>
      </span>
      <span className="list-rail relative z-[2] flex w-11 shrink-0 flex-col items-end justify-between py-0.5">
        <span data-monogram="list" className="list-mark">{props.app.acronym}</span>
        <span className="list-go flex size-7 items-center justify-center overflow-hidden rounded-full bg-foreground/10 text-foreground/70 backdrop-blur-md">
          <svg className="size-3.5" viewBox="0 0 12 12" aria-hidden>
            <path d="M4.646 2.146a.5.5 0 0 0 0 .708L7.793 6 4.646 9.146a.5.5 0 1 0 .708.708l3.5-3.5a.5.5 0 0 0 0-.708l-3.5-3.5a.5.5 0 0 0-.708 0z" fill="currentColor" />
          </svg>
        </span>
      </span>
    </button>
  )
}

function GlassCard(props: DrawnCard & { readonly featured: boolean }): ReactNode {
  const slot = props.featured ? 'mma-slot mma-feature' : 'mma-slot'
  const tag = props.open && props.openLabel !== undefined ? props.openLabel : props.app.version
  return (
    <div className={slot}>
      <button
        type="button"
        className="mma-glass"
        data-app-id={props.app.id}
        data-card="glass"
        style={props.hue}
        onClick={props.onOpen}
      >
        <span className="mma-glass-body">
          <span className="flex w-full items-start justify-between gap-3">
            <span data-monogram="glass" className="mma-mark">{props.app.acronym}</span>
            <span className="mma-tag">{tag}</span>
          </span>
          <span className="block">
            <h3 className="mma-glass-name">{props.app.name}</h3>
            <p className="mma-glass-copy">{props.app.description}</p>
          </span>
        </span>
      </button>
    </div>
  )
}

function HeroCard(props: DrawnCard): ReactNode {
  return (
    <button
      type="button"
      className="relative z-0 flex w-full flex-col items-start overflow-hidden rounded-[13px] border bg-card px-5 pt-4 pb-5 text-left"
      data-app-id={props.app.id}
      data-card="hero"
      style={props.hue}
      onClick={props.onOpen}
    >
      <span aria-hidden className="hero-mist hero-mist-a" />
      <span aria-hidden className="hero-mist hero-mist-b" />
      <span aria-hidden className="hero-mist hero-mist-c" />
      <span className="relative z-[1] flex w-full items-center justify-between gap-3">
        <span data-monogram="hero" className="hero-chip">{props.app.acronym}</span>
        <span className="flex shrink-0 items-center gap-2 text-[13px] text-muted-foreground">
          <span>{props.app.version}</span>
          <OpenMark open={props.open} openLabel={props.openLabel} />
        </span>
      </span>
      <h3 className="relative z-[1] m-0 mt-4 text-lg leading-snug font-semibold tracking-tight">{props.app.name}</h3>
      <p className="mma-copy relative z-[1] m-0 mt-2 line-clamp-2 text-sm leading-snug text-muted-foreground">
        {props.app.description}
      </p>
    </button>
  )
}

function EtchCard(props: DrawnCard): ReactNode {
  return (
    <button
      type="button"
      className="relative flex w-full flex-col items-start overflow-hidden rounded-[13px] border bg-card px-[15px] pt-4 pb-[13px] text-left"
      data-app-id={props.app.id}
      data-card="etch"
      style={props.hue}
      onClick={props.onOpen}
    >
      <EtchMark text={props.app.acronym} />
      <h3 className="relative z-[1] m-0 text-sm font-semibold tracking-tight">{props.app.name}</h3>
      <p className="mma-copy relative z-[1] m-0 mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">
        {props.app.description}
      </p>
      <span className="relative z-[1] mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{props.app.version}</span>
        <OpenMark open={props.open} openLabel={props.openLabel} />
      </span>
    </button>
  )
}

function StampCard(props: DrawnCard): ReactNode {
  return (
    <button
      type="button"
      className="relative flex w-full flex-col items-start overflow-hidden rounded-[13px] border bg-card px-[15px] pt-4 pb-[13px] text-left transition duration-200 ease-out hover:-translate-y-px hover:shadow-[0_8px_22px_var(--shadow)]"
      data-app-id={props.app.id}
      data-card="stamp"
      style={props.hue}
      onClick={props.onOpen}
    >
      <span
        data-monogram="stamp"
        className="absolute top-[13px] right-[13px] z-[1] flex size-11 shrink-0 items-center justify-center rounded-[9px] border-2 border-foreground text-sm font-extrabold tracking-wide text-foreground"
        style={props.hue}
      >
        {props.app.acronym}
      </span>
      <h3 className="relative z-[1] m-0 pr-14 text-sm font-semibold tracking-tight">{props.app.name}</h3>
      <p className="mma-copy relative z-[1] m-0 mt-1 line-clamp-2 pr-14 text-xs leading-snug text-muted-foreground">
        {props.app.description}
      </p>
      <span className="relative z-[1] mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>{props.app.version}</span>
        <OpenMark open={props.open} openLabel={props.openLabel} />
      </span>
    </button>
  )
}

function EtchMark(props: { readonly text: string }): ReactNode {
  const width = Math.max(88, props.text.length * 36)
  return (
    <svg
      data-monogram="etch"
      viewBox={`0 0 ${width} 64`}
      className="relative z-[1] mb-2.5 block h-[52px] overflow-visible"
      style={{ width }}
      aria-hidden
    >
      <text
        className="etch-line"
        x="2"
        y="52"
        fill="var(--card)"
        stroke="hsl(var(--h) 65% 42%)"
        strokeWidth="4.5"
        paintOrder="stroke fill"
        strokeLinejoin="round"
        fontSize="46"
        fontWeight="800"
        letterSpacing="2"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {props.text}
      </text>
      <text
        className="etch-fill"
        x="2"
        y="52"
        fill="hsl(var(--h) 65% 42%)"
        stroke="none"
        fontSize="46"
        fontWeight="800"
        letterSpacing="2"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
      >
        {props.text}
      </text>
    </svg>
  )
}
