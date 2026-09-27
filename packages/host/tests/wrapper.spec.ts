import { afterEach, describe, expect, it, vi } from 'vitest'

import { admitAssetRef } from '../src/compile/asset-path.ts'
import { renderRunnerDocument } from '../src/compile/runner.ts'
import {
  hostWrapperBinding,
  hostWrapperCodes,
  installHostWrapper,
  renderHostWrapper,
} from '../src/compile/wrapper.ts'

interface Installed {
  useApp: () => {
    call: (method: string) => Promise<unknown>
    streamCall: (method: string, args?: unknown) => AsyncIterable<unknown> & Promise<unknown>
    on: (name: string, cb: (data: unknown) => void) => () => void
    onAny: (cb: (event: { name: string; data: unknown }) => void) => () => void
    resolveAssetUrl: (path: string) => string
  }
  miniAppHost: { runInside: <T>(render: () => T) => T }
}

function wrapperDeps() {
  return {
    outsideCode: hostWrapperCodes.outside,
    unmountedCode: hostWrapperCodes.unmounted,
    callUrl: '/api/call',
    assetRoot: '/api/app/com.example.app/assets',
    hook: hostWrapperBinding.hook,
    host: hostWrapperBinding.host,
    appId: 'com.example.app',
    admitAssetRef,
  }
}

function fakeWindow() {
  const parent = {}
  const reloaded: number[] = []
  const listeners: Array<(event: { source: unknown; origin: string; data: unknown }) => void> = []
  return {
    parent,
    reloaded,
    addEventListener: (_type: string, listener: (event: { source: unknown; origin: string; data: unknown }) => void) => {
      listeners.push(listener)
    },
    location: { reload: () => { reloaded.push(1) } },
    send: (origin: string, data: unknown, source: unknown = parent) => {
      for (const listener of listeners) listener({ source, origin, data })
    },
  }
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('host wrapper', () => {
  it('throws outside the wrapper and rejects inside until the call route exists', async () => {
    const previous = (globalThis as { window?: unknown }).window
    const win = fakeWindow()
    ;(globalThis as { window?: unknown }).window = win
    try {
      installHostWrapper(wrapperDeps())
      const installed = (globalThis as { window?: unknown }).window as Installed
      expect(installed.useApp()).toBe(installed.useApp())
      expect(() => installed.useApp().call('ping')).toThrow(expect.objectContaining({ code: hostWrapperCodes.outside }))
      const fetchMock = vi.fn(async () => ({ json: async () => ({ ok: false, error: 'missing method' }) }))
      vi.stubGlobal('fetch', fetchMock)
      await expect(installed.miniAppHost.runInside(() => installed.useApp().call('ping'))).rejects.toMatchObject({
        code: hostWrapperCodes.unmounted,
        message: 'missing method',
      })
      expect(fetchMock).toHaveBeenCalled()
      const seen: unknown[] = []
      const stop = installed.useApp().on('tick', (data) => {
        seen.push(data)
      })
      stop()
      const stopAny = installed.useApp().onAny(() => {
        seen.push('any')
      })
      stopAny()
      expect(seen).toEqual([])
      const got: unknown[] = []
      const any: Array<{ name: string; data: unknown }> = []
      installed.useApp().on('tick', (data) => {
        got.push(data)
      })
      installed.useApp().on('*', (data) => {
        got.push(data)
      })
      installed.useApp().onAny((event) => {
        any.push(event)
      })
      win.send('http://parent', null)
      win.send('http://parent', { type: 'theme' })
      win.send('http://other', { appId: 'com.example.app', name: 'tick', data: 1, seq: 1 })
      win.send('http://parent', { appId: 'com.example.app', name: 'tick', data: 1, seq: 1 })
      win.send('http://parent', { appId: 'com.example.other', name: 'tick', data: 9, seq: 2 })
      win.send('http://parent', { appId: 'com.example.app', name: 'tick' })
      win.send('http://parent', { type: 'app:gap', appId: 'com.example.app', since: 0 })
      expect(got).toEqual([1, 1])
      expect(any).toEqual([{ name: 'tick', data: 1 }, { name: '*', data: { gap: true } }])
      win.send('http://parent', { type: 'app:reload', appId: 'com.example.other' })
      win.send('http://other', { type: 'app:reload', appId: 'com.example.app' })
      expect(win.reloaded).toEqual([])
      win.send('http://parent', { type: 'app:reload', appId: 'com.example.app' })
      expect(win.reloaded).toEqual([1])
      const located = win as { location?: unknown }
      delete located.location
      win.send('http://parent', { type: 'app:reload', appId: 'com.example.app' })
      expect(win.reloaded).toEqual([1])
    } finally {
      ;(globalThis as { window?: unknown }).window = previous
    }
  })

  it('reads streamCall from the call response and rejects a failed method', async () => {
    const previous = (globalThis as { window?: unknown }).window
    const win = fakeWindow()
    ;(globalThis as { window?: unknown }).window = win
    try {
      installHostWrapper(wrapperDeps())
      const installed = (globalThis as { window?: unknown }).window as Installed
      expect(() => installed.useApp().streamCall('run')).toThrow(expect.objectContaining({ code: hostWrapperCodes.outside }))
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        'data: {"value":"hi"}\n\ndata: {"return":{"ok":true}}\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      )))
      const pending = installed.miniAppHost.runInside(() => installed.useApp().streamCall('run', { n: 1 }))
      const seen: unknown[] = []
      for await (const event of pending) seen.push(event)
      expect(seen).toEqual(['hi'])
      await expect(pending).resolves.toEqual({ ok: true })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        'data: {"error":"nope"}\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      )))
      const failed = installed.miniAppHost.runInside(() => installed.useApp().streamCall('run'))
      await expect(failed[Symbol.asyncIterator]().next()).rejects.toMatchObject({
        code: hostWrapperCodes.unmounted,
        message: 'nope',
      })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        'data: not-json\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      )))
      await expect(installed.miniAppHost.runInside(() => installed.useApp().streamCall('run'))).rejects.toMatchObject({
        code: hostWrapperCodes.unmounted,
        message: 'not-json',
      })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        'data: [1]\n\n',
        { status: 200, headers: { 'content-type': 'text/event-stream' } },
      )))
      await expect(installed.miniAppHost.runInside(() => installed.useApp().streamCall('run'))).rejects.toMatchObject({
        code: hostWrapperCodes.unmounted,
      })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        JSON.stringify({ error: 'blocked' }),
        { status: 400, headers: { 'content-type': 'application/json' } },
      )))
      await expect(installed.miniAppHost.runInside(() => installed.useApp().streamCall('run'))).rejects.toMatchObject({
        message: 'blocked',
      })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        JSON.stringify({ ok: false }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      )))
      await expect(installed.miniAppHost.runInside(() => installed.useApp().call('ping'))).rejects.toMatchObject({
        message: 'call failed',
      })
      vi.stubGlobal('fetch', vi.fn(async () => new Response(
        JSON.stringify({}),
        { status: 500, headers: { 'content-type': 'application/json' } },
      )))
      await expect(installed.miniAppHost.runInside(() => installed.useApp().streamCall('run'))).rejects.toMatchObject({
        message: 'call failed',
      })
    } finally {
      ;(globalThis as { window?: unknown }).window = previous
    }
  })

  it('maps an assets path to the iframe URL and rejects a path that leaves that tree', () => {
    const previous = (globalThis as { window?: unknown }).window
    const win = fakeWindow()
    ;(globalThis as { window?: unknown }).window = win
    try {
      installHostWrapper(wrapperDeps())
      const installed = (globalThis as { window?: unknown }).window as Installed
      expect(installed.useApp().resolveAssetUrl('./assets/landing-img.png')).toBe(
        '/api/app/com.example.app/assets/landing-img.png',
      )
      expect(installed.useApp().resolveAssetUrl('assets/icons/mark.svg')).toBe(
        '/api/app/com.example.app/assets/icons/mark.svg',
      )
      expect(() => installed.useApp().resolveAssetUrl('../secret.png')).toThrow(
        expect.objectContaining({ code: hostWrapperCodes.assetInvalid }),
      )
      expect(() => installed.useApp().resolveAssetUrl('./ui.tsx')).toThrow(
        expect.objectContaining({ code: hostWrapperCodes.assetInvalid }),
      )
    } finally {
      ;(globalThis as { window?: unknown }).window = previous
    }
  })

  it('emits the same function the runner inlines', () => {
    const source = renderHostWrapper('com.example.app')
    expect(source).toContain(hostWrapperCodes.outside)
    expect(source).toContain(hostWrapperCodes.assetInvalid)
    expect(source).toContain('/api/app/com.example.app/assets')
    expect(source).not.toMatch(/\b__(?!name\b)[A-Za-z]+\s*\(/)
    const html = renderRunnerDocument({ appId: 'com.example.app', entry: '/api/app/com.example.app/ui/entry.js', style: '', appearance: 'system' })
    expect(html).toContain('prefers-color-scheme')
    expect(html).toContain(hostWrapperBinding.host)
    expect(html.indexOf('runInside')).toBeLessThan(html.indexOf('await import('))
  })
})
