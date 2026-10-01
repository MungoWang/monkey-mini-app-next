import * as React from 'react'

import { Popover, PopoverContent, PopoverTrigger } from '@mohou/ui/components/popover'
import { useLabels } from '@mohou/ui/i18n/context'
import type { UiMessages } from '@mohou/ui/i18n/en'
import { cn } from '@mohou/ui/lib/utils'

/** Default interval chips (ms). */
export const liveRefreshDefaultIntervals = [10_000, 30_000, 60_000, 300_000] as const

const MIN_MS = 6_000
const MAX_MS = 5_994_000
const DEFAULT_MS = 30_000

export type LiveRefreshState = {
  enabled: boolean
  intervalMs: number
}

export type LiveRefreshLabels = Partial<{
  live: string
  off: string
  paused: string
  refreshing: string
  failed: string
  turnOff: string
  custom: string
  customUnit: string
  customInvalid: string
}>

export type LiveRefreshProps = {
  onTick: () => void | Promise<void | { status?: string }>
  defaultEnabled?: boolean
  defaultIntervalMs?: number
  enabled?: boolean
  intervalMs?: number
  onEnabledChange?: (enabled: boolean) => void
  onIntervalChange?: (intervalMs: number) => void
  /** Persist enabled + interval. Pause stays in memory only. */
  persistState?: (state: LiveRefreshState) => boolean | void | Promise<boolean | void>
  /** Override preset list (ms). Custom minutes stay available. */
  intervals?: readonly number[]
  /** Optional partial chrome copy override. */
  labels?: LiveRefreshLabels
  className?: string
}

/**
 * Compact live-refresh chrome: ring + LIVE · status · every N.
 * App owns `onTick` data merge. No host/panel protocol.
 * @when Dashboards / workbenches that need periodic soft refresh inside the iframe.
 * @example
 * <LiveRefresh onTick={async () => { await load() }} />
 * @family Discovery & inspect
 */
export function LiveRefresh({
  onTick,
  defaultEnabled = false,
  defaultIntervalMs = DEFAULT_MS,
  enabled: enabledProp,
  intervalMs: intervalProp,
  onEnabledChange,
  onIntervalChange,
  persistState,
  intervals = liveRefreshDefaultIntervals,
  labels: labelOverride,
  className,
}: LiveRefreshProps) {
  const kit = useLabels('liveRefresh', labelOverride as Partial<UiMessages['liveRefresh']> | undefined)
  const onTickRef = React.useRef(onTick)
  onTickRef.current = onTick

  const [enabledUncontrolled, setEnabledUncontrolled] = React.useState(defaultEnabled)
  const [intervalUncontrolled, setIntervalUncontrolled] = React.useState(
    normalizeInterval(defaultIntervalMs, intervals),
  )
  const enabled = enabledProp ?? enabledUncontrolled
  const intervalMs = intervalProp ?? intervalUncontrolled

  const [paused, setPaused] = React.useState(false)
  const [busy, setBusy] = React.useState(false)
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [custom, setCustom] = React.useState('')
  const [customError, setCustomError] = React.useState('')
  const [now, setNow] = React.useState(() => Date.now())
  const [lastAt, setLastAt] = React.useState(() => Date.now())
  const [dueAt, setDueAt] = React.useState(() => Date.now() + intervalMs)
  const [lastError, setLastError] = React.useState<string | undefined>(undefined)
  const [lastStatus, setLastStatus] = React.useState<string | undefined>(undefined)
  const busyRef = React.useRef(false)

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 250)
    return () => window.clearInterval(id)
  }, [])

  React.useEffect(() => {
    if (!enabled || paused) return
    const id = window.setInterval(() => {
      if (busyRef.current) return
      if (Date.now() < dueAt) return
      void runTick()
    }, 400)
    return () => window.clearInterval(id)
  }, [enabled, paused, dueAt, intervalMs])

  function setEnabled(next: boolean) {
    if (enabledProp === undefined) setEnabledUncontrolled(next)
    onEnabledChange?.(next)
    void persist({ enabled: next, intervalMs })
  }

  function setIntervalMs(next: number) {
    const ms = normalizeInterval(next, intervals)
    if (intervalProp === undefined) setIntervalUncontrolled(ms)
    onIntervalChange?.(ms)
    if (!enabled) {
      if (enabledProp === undefined) setEnabledUncontrolled(true)
      onEnabledChange?.(true)
    }
    void persist({ enabled: true, intervalMs: ms })
    // Anchor on lastAt: next due = last success + new period (or now if already past).
    const stamp = Date.now()
    setDueAt(Math.max(lastAt + ms, stamp))
    setPaused(false)
  }

  async function persist(state: LiveRefreshState) {
    if (persistState === undefined) return
    try {
      const ok = await persistState(state)
      if (ok === false) setLastError(kit.failed)
    } catch {
      setLastError(kit.failed)
    }
  }

  async function runTick() {
    if (busyRef.current) return
    busyRef.current = true
    setBusy(true)
    const nextDue = Date.now() + intervalMs
    setDueAt(nextDue)
    try {
      const result = await onTickRef.current()
      setLastAt(Date.now())
      setLastError(undefined)
      if (typeof result === 'object' && result !== null && typeof result.status === 'string') {
        setLastStatus(result.status)
      } else {
        setLastStatus(undefined)
      }
    } catch (error) {
      setLastError(error instanceof Error && error.message.length > 0 ? error.message : kit.failed)
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  function onMainClick() {
    if (!enabled) {
      const stamp = Date.now()
      setEnabled(true)
      setPaused(false)
      setLastAt(stamp)
      setDueAt(stamp + intervalMs)
      setLastError(undefined)
      return
    }
    if (paused) {
      setPaused(false)
      setDueAt(Date.now() + intervalMs)
      return
    }
    setPaused(true)
  }

  function applyCustom() {
    const ms = parseMinutes(custom)
    if (ms === undefined) {
      setCustomError(kit.customInvalid)
      return
    }
    setCustomError('')
    setCustom('')
    setMenuOpen(false)
    setIntervalMs(ms)
  }

  const progress = (() => {
    if (!enabled || paused) return 0
    if (intervalMs <= 0) return 0
    const started = dueAt - intervalMs
    return Math.max(0, Math.min(100, ((now - started) / intervalMs) * 100))
  })()

  const mainText = (() => {
    const prefix = kit.live
    if (!enabled) return `${prefix} · ${kit.off}`
    if (paused) return `${prefix} · ${kit.paused}`
    if (busy) return `${prefix} · ${kit.refreshing}`
    return `${prefix} · ${formatAgo(now - lastAt, kit)}`
  })()

  const everyText = formatEvery(intervalMs, kit)
  const note = lastError ?? lastStatus

  return (
    <div
      data-testid="live-refresh"
      data-enabled={enabled ? '1' : '0'}
      data-paused={paused ? '1' : '0'}
      className={cn(
        'inline-flex items-center gap-2 text-[10px] font-semibold tracking-[0.12em] text-muted-foreground uppercase',
        className,
      )}
    >
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full"
        style={
          enabled && !paused
            ? {
                background: `conic-gradient(var(--primary) ${progress}%, color-mix(in oklch, var(--foreground) 12%, transparent) 0)`,
                WebkitMask:
                  'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
                mask: 'radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))',
              }
            : { background: 'color-mix(in oklch, var(--foreground) 22%, transparent)' }
        }
      />
      <button
        type="button"
        className="hover:text-foreground cursor-pointer border-0 bg-transparent p-0 font-inherit tracking-inherit text-inherit uppercase"
        onClick={onMainClick}
      >
        {mainText}
      </button>
      {enabled ? (
        <>
          <span className="text-foreground/25">·</span>
          <Popover open={menuOpen} onOpenChange={setMenuOpen}>
            <PopoverTrigger
              render={
                <button
                  type="button"
                  className="hover:text-foreground cursor-pointer border-0 bg-transparent p-0 font-inherit tracking-inherit text-inherit uppercase"
                />
              }
            >
              {everyText}
            </PopoverTrigger>
            <PopoverContent align="end" className="w-44 p-1.5 tracking-normal normal-case">
              <button
                type="button"
                className="hover:bg-muted flex h-8 w-full items-center rounded-md px-2.5 text-left text-xs font-semibold"
                onClick={() => {
                  setEnabled(false)
                  setPaused(false)
                  setMenuOpen(false)
                }}
              >
                {kit.turnOff}
              </button>
              {intervals.map((ms) => (
                <button
                  key={ms}
                  type="button"
                  data-on={intervalMs === ms ? '1' : '0'}
                  className={cn(
                    'hover:bg-muted flex h-8 w-full items-center rounded-md px-2.5 text-left text-xs font-semibold',
                    intervalMs === ms && 'bg-muted',
                  )}
                  onClick={() => {
                    setIntervalMs(ms)
                    setMenuOpen(false)
                  }}
                >
                  {formatEvery(ms, kit)}
                </button>
              ))}
              <div className="text-muted-foreground flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 text-[11px] font-semibold">
                <span>{kit.custom}</span>
                <input
                  value={custom}
                  inputMode="decimal"
                  placeholder="1.5"
                  className="border-border bg-background text-foreground h-7 w-14 rounded-md border px-2 text-xs font-semibold outline-none"
                  onChange={(event) => setCustom(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') applyCustom()
                  }}
                />
                <span>{kit.customUnit}</span>
              </div>
              {customError ? (
                <div className="text-destructive px-2.5 pb-1 text-[11px]">{customError}</div>
              ) : null}
            </PopoverContent>
          </Popover>
        </>
      ) : null}
      {note ? (
        <span
          className={cn(
            'max-w-[12rem] truncate text-[10px] font-semibold tracking-normal normal-case',
            lastError ? 'text-destructive' : 'text-muted-foreground',
          )}
        >
          {note}
        </span>
      ) : null}
    </div>
  )
}

function normalizeInterval(ms: number, _intervals: readonly number[]): number {
  if (!Number.isFinite(ms) || ms < MIN_MS) return DEFAULT_MS
  if (ms > MAX_MS) return MAX_MS
  return Math.round(ms)
}

function parseMinutes(raw: string): number | undefined {
  const text = raw.trim()
  if (!/^\d+(\.\d)?$/.test(text)) return undefined
  const min = Number(text)
  if (!Number.isFinite(min) || min < 0.1 || min > 99.9) return undefined
  const ms = Math.round(min * 60_000)
  if (ms < MIN_MS || ms > MAX_MS) return undefined
  return ms
}

function formatAgo(ms: number, kit: UiMessages['liveRefresh']): string {
  if (ms < 1500) return kit.justNow
  if (ms < 60_000) return kit.secondsAgo(Math.floor(ms / 1000))
  return kit.minutesAgo(Math.floor(ms / 60_000))
}

function formatEvery(intervalMs: number, kit: UiMessages['liveRefresh']): string {
  if (intervalMs < 60_000 && intervalMs % 1000 === 0) {
    return kit.everySeconds(intervalMs / 1000)
  }
  const min = intervalMs / 60_000
  if (Number.isInteger(min)) return kit.everyMinutes(min)
  return kit.everyMinutes(Number(min.toFixed(1)))
}
