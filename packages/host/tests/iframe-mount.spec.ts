import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { platformVendorPath } from '../src/compile/allowlist.ts'
import type { HostEnv } from '../src/http/env.ts'
import { mountIframe } from '../src/http/iframe.ts'
import { httpLayout } from '../src/http/layout.ts'
import type { LoopbackPorts } from '../src/http/ports.ts'
import { RouteError } from '../src/http/route-codes.ts'

const ports = {
  call: async (_appId: string, method: string, _args: unknown, publish?: (value: unknown) => void) => {
    if (method === 'stream') {
      publish?.('hi')
      return { ok: true, value: 'row' }
    }
    if (method === 'wrap') return { ok: true, value: 1 }
    if (method === 'failObj') return { ok: false, error: { message: 'nope' } }
    if (method === 'failStr') return { ok: false, error: 'nope' }
    if (method === 'failBare') return { ok: false, error: 1 }
    throw 'boom'
  },
  vendorFile: async (file: string) => {
    if (file === 'lodash.js') throw new Error('missing vendor')
    return 'ok'
  },
  runnerDocument: async (appId: string) => {
    if (appId === 'com.example.missing') throw new Error('no runner')
    return '<html></html>'
  },
  entryScript: async (appId: string) => {
    if (appId === 'com.example.bad') throw 'no entry'
    return 'export {}'
  },
  stylesheet: async (appId: string) => {
    if (appId === 'com.example.bad') throw new Error('no sheet')
    return 'body{}'
  },
  authorized: (header: string | undefined) => header === 'Bearer t',
  readErrors: () => ({ errors: [] }),
  subscribeHost: () => () => undefined,
  subscribeFrames: () => () => undefined,
  subscribeApp: () => () => undefined,
} as unknown as LoopbackPorts

describe('iframe mount', () => {
  it('shapes call results and diagnostic posts', async () => {
    const app = new Hono<HostEnv>()
    const recorded: string[] = []
    mountIframe(app, {
      loopback: ports,
      diagnostics: {
        recordError: () => recorded.push('error'),
        markAlive: () => recorded.push('alive'),
        answerView: () => true,
        maxBodyBytes: 32,
      },
    })
    const call = (method: string) => app.request(httpLayout.call, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ appId: 'com.example.app', method }),
    })
    expect(await (await call('wrap')).json()).toEqual({ ok: true, value: 1 })
    expect(await (await call('failObj')).json()).toEqual({ ok: false, error: 'nope' })
    expect(await (await call('failStr')).json()).toEqual({ ok: false, error: 'nope' })
    expect(await (await call('failBare')).json()).toEqual({ ok: false, error: 'call failed' })
    expect(await (await call('throw')).json()).toEqual({ ok: false, error: 'call failed' })
    const streamed = await app.request(httpLayout.call, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'text/event-stream' },
      body: JSON.stringify({ appId: 'com.example.app', method: 'stream' }),
    })
    expect(streamed.headers.get('content-type')).toContain('text/event-stream')
    const body = await streamed.text()
    expect(body).toContain('data: {"value":"hi"}')
    expect(body).toContain('data: {"return":"row"}')
    expect((await app.request(platformVendorPath('lodash'))).status).toBe(400)
    expect((await app.request('/app/com.example.missing')).status).toBe(400)
    expect((await app.request('/api/app/not-an-id/errors', { method: 'POST', body: 'x' })).status).toBe(204)
    expect((await app.request('/api/app/com.example.app/alive', { method: 'POST', body: '{}' })).status).toBe(204)
    expect((await app.request('/api/app/com.example.app/errors', { method: 'POST', body: '{"k":1}' })).status).toBe(204)
    expect((await app.request('/api/app/com.example.app/errors', { method: 'POST', body: 'too-big-to-keep-this-payload' })).status).toBe(204)
    expect(recorded).toEqual(['alive', 'error'])
    expect((await app.request('/api/app/com.example.bad/ui/ui.css')).status).toBe(400)
    // Compile failure stays a JS module so the iframe can show the message (not JSON 400).
    const entry = await app.request('/api/app/com.example.bad/ui/entry.js')
    expect(entry.status).toBe(200)
    expect(await entry.text()).toContain('throw new Error')
  })

  it('serves an admitted asset and 404s a miss', async () => {
    const seen: string[] = []
    const app = new Hono<HostEnv>()
    mountIframe(app, {
      loopback: {
        ...ports,
        assetFile: async (_appId, rest) => {
          seen.push(rest)
          if (rest === 'mark.svg') {
            return { bytes: new TextEncoder().encode('<svg/>'), type: 'image/svg+xml' }
          }
          throw new RouteError('not-found', 'asset is missing')
        },
      },
    })
    const ok = await app.request('/api/app/com.example.app/assets/mark.svg')
    expect(ok.status).toBe(200)
    expect(ok.headers.get('content-type')).toBe('image/svg+xml')
    expect(await ok.text()).toBe('<svg/>')
    const nested = await app.request('/api/app/com.example.app/assets/icons/dot.png')
    expect(nested.status).toBe(404)
    expect(await nested.json()).toMatchObject({ ok: false, error: { code: 'not-found' } })
    expect(seen).toEqual(['mark.svg', 'icons/dot.png'])
  })
})
