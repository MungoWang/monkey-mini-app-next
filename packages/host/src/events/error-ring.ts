/** Kinds an iframe may report. A resource-load error with no message is dropped. */
export const errorKinds = ['render', 'module', 'uncaught', 'async'] as const

export type ErrorKind = (typeof errorKinds)[number]

export interface AppErrorRecord {
  seq: number
  kind: ErrorKind
  message: string
  componentStack?: string
}

/** Ring cap when the caller omits one. Host policy, not a locked number. */
const DEFAULT_CAP = 50

interface Ring {
  seq: number
  errors: AppErrorRecord[]
  dropped: number
  opened: boolean
}

interface AdmittedError {
  kind: ErrorKind
  message: string
  componentStack?: string
}

/**
 * Admit one iframe error report. A bad kind or an empty message is dropped.
 * @param raw - untrusted JSON
 */
export function admitErrorReport(raw: unknown): AdmittedError | undefined {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return undefined
  const kind = 'kind' in raw ? raw.kind : undefined
  const message = 'message' in raw ? raw.message : undefined
  const componentStack = 'componentStack' in raw ? raw.componentStack : undefined
  if (typeof kind !== 'string' || !isErrorKind(kind)) return undefined
  if (typeof message !== 'string' || message.length === 0) return undefined
  return {
    kind,
    message,
    ...typeof componentStack === 'string' ? { componentStack } : {},
  }
}

/**
 * Per-app error ring. Diagnostics never enter the author event buffer.
 * @param cap - retained errors; older ones increment `dropped`
 */
export function createErrorRing(cap = DEFAULT_CAP) {
  const apps = new Map<string, Ring>()

  function ring(appId: string): Ring {
    const existing = apps.get(appId)
    if (existing !== undefined) return existing
    const created: Ring = { seq: 0, errors: [], dropped: 0, opened: false }
    apps.set(appId, created)
    return created
  }

  return {
    record(appId: string, raw: unknown) {
      const admitted = admitErrorReport(raw)
      if (admitted === undefined) return
      const current = ring(appId)
      current.seq += 1
      const entry: AppErrorRecord = {
        seq: current.seq,
        kind: admitted.kind,
        message: admitted.message,
        ...admitted.componentStack === undefined ? {} : { componentStack: admitted.componentStack },
      }
      current.errors.push(entry)
      while (current.errors.length > cap) {
        current.errors.shift()
        current.dropped += 1
      }
    },
    markOpened(appId: string) {
      ring(appId).opened = true
    },
    clearReload(appId: string) {
      const current = ring(appId)
      current.errors = []
      current.dropped = 0
      current.opened = false
    },
    read(appId: string, since?: number, clear = false) {
      const current = ring(appId)
      if (clear) current.errors = []
      const errors = since === undefined ? [...current.errors] : current.errors.filter(item => item.seq > since)
      const hint = current.errors.length === 0 && !current.opened
      return {
        errors,
        lastSeq: current.seq,
        dropped: current.dropped,
        ...hint ? { emptyHint: 'open the app before treating an empty ring as clean' } : {},
      }
    },
    forget(appId: string) {
      apps.delete(appId)
    },
  }
}

function isErrorKind(value: string): value is ErrorKind {
  return (errorKinds as readonly string[]).includes(value)
}
