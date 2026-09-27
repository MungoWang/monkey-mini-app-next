import { appResource, httpLayout } from '../http/layout.ts'
import { admitAssetRef, assetInvalidCode } from './asset-path.ts'

/** Codes the host wrapper emits in the iframe. Callers match `code`. */
export const hostWrapperCodes = {
  outside: 'call-outside-wrapper',
  unmounted: 'call-unmounted',
  assetInvalid: assetInvalidCode,
} as const

/** Names the runner and the future kit share. Spell them here. */
export const hostWrapperBinding = {
  hook: 'useApp',
  host: 'miniAppHost',
} as const

interface WrapperDeps {
  readonly outsideCode: string
  readonly unmountedCode: string
  readonly hook: string
  readonly host: string
  readonly appId: string
  readonly callUrl: string
  readonly assetRoot: string
  admitAssetRef(raw: string): string
}

interface WrapperMessage {
  source: unknown
  origin: string
  data: unknown
}

interface WrapperWindow extends HostWindow {
  parent: unknown
  location?: { reload(): void }
  addEventListener(type: string, listener: (event: WrapperMessage) => void): void
}

interface HostWindow {
  [key: string]: unknown
}

/**
 * Install `useApp`. `call` throws outside the host wrapper.
 * The handle is one object for the life of the document, so an effect may depend on `call`.
 * Inside the wrapper `call` posts to the loopback call route and reads one JSON result.
 * `streamCall` is the same route with `accept: text/event-stream`. The body is that call's events.
 * A parent-posted author event reaches `on` and `onAny`. A gap reaches `onAny` only.
 * Ping and the retry hint stay off this hook. No imports.
 * @param deps - codes and the binding names
 */
export function installHostWrapper(deps: WrapperDeps): void {
  const realm = globalThis as unknown as { window?: WrapperWindow }
  let win: WrapperWindow
  if (realm.window !== undefined) win = realm.window
  else win = globalThis
  let parentOrigin: string | undefined
  let inside = 0
  let mounted = false
  const named = new Map<string, Array<(data: unknown) => void>>()
  const any: Array<(event: { name: string; data: unknown }) => void> = []

  function fail(code: string, message: string): Error {
    const error = new Error(message) as Error & { code: string }
    error.code = code
    return error
  }

  function readStreamFrame(line: string, code: string): object {
    const raw = line.slice(5).trim()
    try {
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) throw fail(code, 'call failed')
      return parsed
    } catch (error) {
      if (error instanceof Error && 'code' in error) throw error
      throw fail(code, raw.length > 0 ? raw : 'call failed')
    }
  }

  const handle = {
    call(method: string, args?: unknown) {
      if (!mounted && inside === 0) throw fail(deps.outsideCode, 'useApp() call is outside the host wrapper')
      return fetch(deps.callUrl, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ appId: deps.appId, method, args }),
      }).then(async (response) => {
        const body = await response.json() as { ok?: boolean; value?: unknown; error?: string }
        if (body.ok !== true) throw fail(deps.unmountedCode, typeof body.error === 'string' ? body.error : 'call failed')
        return body.value
      })
    },
    streamCall(method: string, args?: unknown) {
      if (!mounted && inside === 0) throw fail(deps.outsideCode, 'useApp() call is outside the host wrapper')
      return openStream(method, args)
    },
    on(name: string, cb: (data: unknown) => void) {
      const list = named.get(name) ?? []
      list.push(cb)
      named.set(name, list)
      return () => {
        const next = (named.get(name) ?? []).filter((item) => {
          return item !== cb
        })
        named.set(name, next)
      }
    },
    onAny(cb: (event: { name: string; data: unknown }) => void) {
      any.push(cb)
      return () => {
        const index = any.indexOf(cb)
        if (index >= 0) any.splice(index, 1)
      }
    },
    resolveAssetUrl(path: string) {
      const inner = deps.admitAssetRef(path)
      return `${deps.assetRoot}/${inner.split('/').map(encodeURIComponent).join('/')}`
    },
  }

  function openStream(method: string, args: unknown) {
    const queued: unknown[] = []
    let waiting: { resolve: (step: IteratorResult<unknown>) => void; reject: (error: unknown) => void } | undefined
    let settled = false
    let failure: unknown
    let started = false
    let resolveText: (value: unknown) => void
    let rejectText: (error: unknown) => void
    const text = new Promise<unknown>((resolve, reject) => {
      resolveText = resolve
      rejectText = reject
    })
    void text.catch(() => undefined)
    const push = (value: unknown): void => {
      if (waiting !== undefined) {
        const resume = waiting
        waiting = undefined
        resume.resolve({ value, done: false })
        return
      }
      queued.push(value)
    }
    const close = (): void => {
      const resume = waiting
      waiting = undefined
      if (resume === undefined) return
      if (failure instanceof Error) resume.reject(failure)
      else resume.resolve({ value: undefined, done: true })
    }
    const start = (): void => {
      if (started) return
      started = true
      readFrames(method, args, push).then((value) => {
        settled = true
        resolveText(value)
        close()
      }, (error: unknown) => {
        settled = true
        failure = error
        rejectText(error)
        close()
      })
    }
    return {
      [Symbol.asyncIterator](): AsyncIterator<unknown> {
        return {
          next() {
            start()
            if (queued.length > 0) return Promise.resolve({ value: queued.shift(), done: false as const })
            if (failure !== undefined) return Promise.reject(failure instanceof Error ? failure : new Error('call failed'))
            if (settled) return Promise.resolve({ value: undefined, done: true as const })
            return new Promise((resolve, reject) => {
              waiting = { resolve, reject }
            })
          },
        }
      },
      then(onFulfilled?: (value: unknown) => unknown, onRejected?: (error: unknown) => unknown) {
        start()
        return text.then(onFulfilled, onRejected)
      },
    }
  }

  async function readFrames(method: string, args: unknown, push: (value: unknown) => void): Promise<unknown> {
    const response = await fetch(deps.callUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ appId: deps.appId, method, args }),
    })
    const kind = response.headers.get('content-type') ?? ''
    if (!response.ok || !kind.includes('text/event-stream') || response.body === null) {
      const body = await response.json() as { error?: string }
      throw fail(deps.unmountedCode, typeof body.error === 'string' ? body.error : 'call failed')
    }
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let pending = ''
    let returned: unknown
    for (;;) {
      const step = await reader.read()
      if (step.done) return returned
      pending += decoder.decode(step.value, { stream: true })
      let split = pending.indexOf('\n\n')
      while (split >= 0) {
        const block = pending.slice(0, split)
        pending = pending.slice(split + 2)
        const line = block.split('\n').find(item => item.startsWith('data:'))
        if (line !== undefined) {
          const frame = readStreamFrame(line, deps.unmountedCode)
          if ('error' in frame && typeof frame.error === 'string') throw fail(deps.unmountedCode, frame.error)
          if ('return' in frame) returned = frame.return
          else if ('value' in frame) push(frame.value)
        }
        split = pending.indexOf('\n\n')
      }
    }
  }

  function useApp(): typeof handle {
    return handle
  }

  function runInside<T>(render: () => T): T {
    mounted = true
    inside += 1
    try {
      return render()
    } finally {
      inside -= 1
    }
  }

  win[deps.hook] = useApp
  win[deps.host] = { useApp, runInside }
  win.addEventListener('message', (event) => {
    if (event.source !== win.parent) return
    if (parentOrigin === undefined) parentOrigin = event.origin
    if (event.origin !== parentOrigin) return
    if (isReload(event.data)) {
      win.location?.reload()
      return
    }
    deliver(event.data)
  })

  function isReload(value: unknown): boolean {
    return typeof value === 'object'
      && value !== null
      && 'type' in value
      && value.type === 'app:reload'
      && 'appId' in value
      && value.appId === deps.appId
  }

  function deliver(value: unknown): void {
    if (typeof value !== 'object' || value === null) return
    if (!('appId' in value) || value.appId !== deps.appId) return
    if ('type' in value && value.type === 'app:gap') {
      for (const cb of [...any]) cb({ name: '*', data: { gap: true } })
      return
    }
    if (!('name' in value) || typeof value.name !== 'string') return
    if (!('seq' in value) || typeof value.seq !== 'number') return
    const data = 'data' in value ? value.data : undefined
    for (const [name, list] of named) {
      if (name !== '*' && name !== value.name) continue
      for (const cb of [...list]) cb(data)
    }
    for (const cb of [...any]) cb({ name: value.name, data })
  }
}

const wrapperHelpers = new Set(['__name'])

/** Source the runner inlines before the app module. */
export function renderHostWrapper(appId: string, callUrl = httpLayout.call): string {
  const deps = {
    outsideCode: hostWrapperCodes.outside,
    unmountedCode: hostWrapperCodes.unmounted,
    hook: hostWrapperBinding.hook,
    host: hostWrapperBinding.host,
    appId,
    callUrl,
    assetRoot: appResource(appId, httpLayout.assets),
  }
  const source = `{\nconst __name = (target) => target;\nconst admitAssetRef = ${admitAssetRef.toString()};\n(${installHostWrapper.toString()})(Object.assign(${JSON.stringify(deps)}, { admitAssetRef }))\n}`
  for (const match of source.matchAll(/\b(__[A-Za-z]+)\s*\(/g)) {
    const name = match[1]
    if (name !== undefined && !wrapperHelpers.has(name)) {
      throw new Error(`host wrapper helper is not declared: ${name}`)
    }
  }
  return source
}
