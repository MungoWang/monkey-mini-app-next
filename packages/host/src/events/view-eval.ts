import type { HostEvent } from './host-events.ts'

/** View states. Only `stuck` means the main thread is blocked. */
export const viewStates = ['live', 'not-open', 'runner-not-booted', 'pending', 'stuck'] as const

export type ViewState = (typeof viewStates)[number]

export type ViewStop = 'bytes' | 'nodes' | 'depth' | 'timeout'

export interface ViewEnvelope {
  result: unknown
  view: ViewState
  tookMs: number
  bytes: number
  truncated: boolean
  stoppedBy: ViewStop | null
  visited: number
  matched: number
  dropped?: number
  error?: string
  hint?: string
  budgetMs: number
}

/** Query wait when the caller omits one. Host policy, not a locked number. */
export const DEFAULT_VIEW_TIMEOUT_MS = 3_000

/** Byte cap when the caller omits one. Host policy, not a locked number. */
export const DEFAULT_VIEW_MAX_BYTES = 64_000

/** Node cap when the caller omits one. Host policy, not a locked number. */
export const DEFAULT_VIEW_MAX_NODES = 200

/** Depth cap when the caller omits one. Host policy, not a locked number. */
export const DEFAULT_VIEW_MAX_DEPTH = 8

/** Omitted `code` reads the document root. No fourth helper name. */
export const DEFAULT_VIEW_CODE = 'return mma.$("#root")'

interface PendingQuery {
  appId: string
  budgetMs: number
  started: number
  settle: (envelope: ViewEnvelope) => void
}

/**
 * One in-flight view query per id. A late, duplicate, or wrong-app reply cannot settle it.
 * The iframe runs the code. This module only routes it.
 */
export function createViewQueries(defaults?: { timeoutMs?: number; maxBytes?: number }) {
  const alive = new Set<string>()
  const pending = new Map<string, PendingQuery>()
  const timeoutMs = defaults?.timeoutMs ?? DEFAULT_VIEW_TIMEOUT_MS
  const maxBytes = defaults?.maxBytes ?? DEFAULT_VIEW_MAX_BYTES
  let seq = 0

  return {
    markAlive(appId: string) {
      alive.add(appId)
    },
    forgetAlive(appId: string) {
      alive.delete(appId)
    },
    /** A client that has no frame for this app. Pending queries settle `not-open`, and the stale flag goes. */
    absent(appId: string) {
      alive.delete(appId)
      for (const [id, query] of [...pending]) {
        if (query.appId !== appId) continue
        pending.delete(id)
        query.settle(envelope({
          view: 'not-open',
          budgetMs: query.budgetMs,
          hint: 'open the app; no frame is mounted',
          tookMs: Date.now() - query.started,
        }))
      }
    },
    ask(input: {
      appId: string
      code?: string
      timeoutMs?: number
      maxBytes?: number
      maxNodes?: number
      maxDepth?: number
      connected: boolean
      publish: (event: HostEvent) => void
    }): Promise<ViewEnvelope> {
      const budgetMs = input.timeoutMs ?? timeoutMs
      const bytes = input.maxBytes ?? maxBytes
      const nodes = input.maxNodes ?? DEFAULT_VIEW_MAX_NODES
      const depth = input.maxDepth ?? DEFAULT_VIEW_MAX_DEPTH
      const code = input.code ?? DEFAULT_VIEW_CODE
      if (!input.connected) {
        return Promise.resolve(envelope({
          view: 'not-open',
          budgetMs,
          hint: 'open the app; no panel is attached',
          tookMs: 0,
        }))
      }
      if (alive.has(input.appId) && [...pending.values()].some(query => query.appId === input.appId)) {
        return Promise.resolve(envelope({
          view: 'pending',
          budgetMs,
          hint: 'the expression is still running',
          tookMs: 0,
        }))
      }
      seq += 1
      const requestId = `view-${seq}`
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          pending.delete(requestId)
          resolve(envelope({
            view: alive.has(input.appId) ? 'stuck' : 'runner-not-booted',
            budgetMs,
            stoppedBy: 'timeout',
            hint: alive.has(input.appId)
              ? 'the main thread is blocked; reload the tab'
              : 'no live frame for this app; open or reload it in the panel',
            tookMs: budgetMs,
          }))
        }, budgetMs)
        pending.set(requestId, {
          appId: input.appId,
          budgetMs,
          started: Date.now(),
          settle: (value) => {
            clearTimeout(timer)
            resolve(value)
          },
        })
        input.publish({
          type: 'app:eval',
          appId: input.appId,
          requestId,
          code,
          budgetMs,
          maxBytes: bytes,
          maxNodes: nodes,
          maxDepth: depth,
        })
      })
    },
    answer(requestId: string, appId: string, raw: unknown): boolean {
      const query = pending.get(requestId)
      if (query === undefined || query.appId !== appId) return false
      pending.delete(requestId)
      query.settle(envelopeFromAnswer(raw, query.budgetMs, Date.now() - query.started))
      return true
    },
  }
}

function envelope(input: {
  view: ViewState
  budgetMs: number
  tookMs: number
  hint?: string
  stoppedBy?: ViewStop
  result?: unknown
  error?: string
}): ViewEnvelope {
  return {
    result: input.result ?? null,
    view: input.view,
    tookMs: input.tookMs,
    bytes: 0,
    truncated: input.stoppedBy !== undefined,
    stoppedBy: input.stoppedBy ?? null,
    visited: 0,
    matched: 0,
    budgetMs: input.budgetMs,
    ...input.hint === undefined ? {} : { hint: input.hint },
    ...input.error === undefined ? {} : { error: input.error },
  }
}

function envelopeFromAnswer(raw: unknown, budgetMs: number, tookMs: number): ViewEnvelope {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return envelope({ view: 'live', budgetMs, tookMs, result: raw })
  }
  const view = 'view' in raw && isViewState(raw.view) ? raw.view : 'live'
  const stoppedBy = 'stoppedBy' in raw && isStop(raw.stoppedBy) ? raw.stoppedBy : null
  return {
    result: 'result' in raw ? raw.result : null,
    view,
    tookMs,
    bytes: numberField(raw, 'bytes'),
    truncated: stoppedBy !== null,
    stoppedBy,
    visited: numberField(raw, 'visited'),
    matched: numberField(raw, 'matched'),
    budgetMs,
    ...'error' in raw && typeof raw.error === 'string' ? { error: raw.error } : {},
    ...'hint' in raw && typeof raw.hint === 'string' ? { hint: raw.hint } : {},
    ...'dropped' in raw && typeof raw.dropped === 'number' ? { dropped: raw.dropped } : {},
  }
}

function numberField(raw: object, key: string): number {
  const value = key in raw ? raw[key as keyof typeof raw] : undefined
  return typeof value === 'number' && Number.isFinite(value) ? value : 0
}

function isViewState(value: unknown): value is ViewState {
  return typeof value === 'string' && (viewStates as readonly string[]).includes(value)
}

function isStop(value: unknown): value is ViewStop {
  return value === 'bytes' || value === 'nodes' || value === 'depth' || value === 'timeout'
}
