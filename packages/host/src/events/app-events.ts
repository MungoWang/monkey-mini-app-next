/** Retained events per app when the caller omits a bound. Host policy, not a locked number. */
export const DEFAULT_APP_EVENT_TAIL = 50

/** Retry hint sent when a subscriber opens. Host policy, not a locked number. */
export const DEFAULT_APP_EVENT_RETRY_MS = 3000

/** Ping interval while a subscriber is attached. Host policy, not a locked number. */
export const DEFAULT_APP_EVENT_PING_MS = 15_000

/** One author event. Diagnostics never use this shape. */
export interface AuthorEvent {
  readonly name: string
  readonly data: unknown
  readonly seq: number
}

/** The retained tail no longer contains `since`. The UI refetches. It does not invent events. */
export interface AppGap {
  readonly type: 'app:gap'
  readonly appId: string
  readonly since: number
}

/** Sent to the subscriber that just opened. Not an author channel. */
export interface AppRetry {
  readonly type: 'retry'
  readonly retryMs: number
}

/** Sent while at least one subscriber is attached. Not an author channel. */
export interface AppPing {
  readonly type: 'ping'
}

export type AppStreamItem = AuthorEvent | AppGap | AppRetry | AppPing

/** What `useApp().on` and `useApp().onAny` see. Ping and the retry hint stay on the stream. */
export interface AppHooks {
  on(name: string, callback: (data: unknown) => void): () => void
  onAny(callback: (event: { name: string; data: unknown }) => void): () => void
}

/** The per-app author buffer. Diagnostics do not use this. */
export interface AppEvents {
  push(appId: string, name: string, data?: unknown): void
  subscribe(appId: string, lastSeq: number, listener: (item: AppStreamItem) => void): () => void
  observe(listener: (appId: string, event: AuthorEvent) => void): () => void
  retained(): ReadonlyArray<{ readonly appId: string; readonly gap?: { readonly since: number }; readonly events: readonly AuthorEvent[] }>
  dispose(): void
}

interface AppLog {
  seq: number
  events: AuthorEvent[]
  listeners: Set<(item: AppStreamItem) => void>
  ping: ReturnType<typeof setInterval> | undefined
}

/**
 * Per-app author stream. `tailLength` is host policy and is not locked.
 * @param options - buffer bound and the warning log
 */
export function createAppEvents(options: {
  readonly tailLength: number
  readonly retryMs?: number
  readonly pingMs?: number
  readonly log?: (message: string) => void
}): AppEvents {
  const retryMs = options.retryMs ?? DEFAULT_APP_EVENT_RETRY_MS
  const pingMs = options.pingMs ?? DEFAULT_APP_EVENT_PING_MS
  const apps = new Map<string, AppLog>()
  const observers = new Set<(appId: string, event: AuthorEvent) => void>()
  const log = options.log ?? ((message: string) => {
    console.warn(message)
  })

  function read(appId: string): AppLog {
    const existing = apps.get(appId)
    if (existing !== undefined) return existing
    const created: AppLog = { seq: 0, events: [], listeners: new Set(), ping: undefined }
    apps.set(appId, created)
    return created
  }

  return {
    push(appId, name, data) {
      if (data !== undefined && !isJson(data)) {
        log(`ctx.push("${name}") dropped: data is not JSON`)
        return
      }
      const app = read(appId)
      app.seq += 1
      const event: AuthorEvent = { name, data, seq: app.seq }
      app.events.push(event)
      if (app.events.length > options.tailLength) {
        app.events.splice(0, app.events.length - options.tailLength)
      }
      for (const listener of [...app.listeners]) listener(event)
      for (const observer of [...observers]) observer(appId, event)
    },
    observe(listener) {
      observers.add(listener)
      return () => {
        observers.delete(listener)
      }
    },
    retained() {
      const rows = []
      for (const [appId, app] of apps) {
        const oldest = app.events[0]
        if (oldest === undefined) continue
        const gap = oldest.seq > 1 ? { since: 0 } : undefined
        rows.push({
          appId,
          events: app.events,
          ...gap === undefined ? {} : { gap },
        })
      }
      return rows
    },
    subscribe(appId, lastSeq, listener) {
      const app = read(appId)
      listener({ type: 'retry', retryMs })
      const oldest = app.events[0]
      if (oldest !== undefined && oldest.seq > lastSeq + 1) {
        listener({ type: 'app:gap', appId, since: lastSeq })
      }
      for (const event of app.events) {
        if (event.seq > lastSeq) listener(event)
      }
      app.listeners.add(listener)
      if (app.listeners.size === 1 && pingMs > 0 && app.ping === undefined) {
        const timer = setInterval(() => {
          for (const current of [...app.listeners]) current({ type: 'ping' })
        }, pingMs)
        timer.unref()
        app.ping = timer
      }
      return () => {
        app.listeners.delete(listener)
        if (app.listeners.size === 0 && app.ping !== undefined) {
          clearInterval(app.ping)
          app.ping = undefined
        }
      }
    },
    dispose() {
      observers.clear()
      for (const app of apps.values()) {
        if (app.ping !== undefined) clearInterval(app.ping)
        app.ping = undefined
        app.listeners.clear()
      }
    },
  }
}

/**
 * Forward every app onto one listener. Live events are registered before the retained tail is copied.
 * The panel uses this on the host stream so an open tab does not hold its own socket.
 */
export function forwardFrames(events: AppEvents, listener: (event: unknown) => void): () => void {
  const stop = events.observe((appId, event) => {
    listener({ type: 'app:event', appId, name: event.name, data: event.data, seq: event.seq })
  })
  for (const row of events.retained()) {
    if (row.gap !== undefined) listener({ type: 'app:gap', appId: row.appId, since: row.gap.since })
    for (const event of row.events) {
      listener({ type: 'app:event', appId: row.appId, name: event.name, data: event.data, seq: event.seq })
    }
  }
  return stop
}

/** Map the author stream onto `on` / `onAny`. A gap is `{ name: "*", data: { gap: true } }` for `onAny` only. */
export function bindAppHooks(events: AppEvents, appId: string, lastSeq = 0): AppHooks {
  return {
    on(name, callback) {
      return events.subscribe(appId, lastSeq, (item) => {
        if (!isAuthorEvent(item)) return
        if (name !== '*' && item.name !== name) return
        callback(item.data)
      })
    },
    onAny(callback) {
      return events.subscribe(appId, lastSeq, (item) => {
        if (isGap(item)) {
          callback({ name: '*', data: { gap: true } })
          return
        }
        if (!isAuthorEvent(item)) return
        callback({ name: item.name, data: item.data })
      })
    },
  }
}

function isAuthorEvent(item: AppStreamItem): item is AuthorEvent {
  return 'seq' in item
}

function isGap(item: AppStreamItem): item is AppGap {
  return 'type' in item && item.type === 'app:gap'
}

function isJson(value: unknown): boolean {
  if (typeof value === 'function' || typeof value === 'symbol' || value === undefined) return false
  try {
    JSON.stringify(value)
    return true
  } catch {
    return false
  }
}
