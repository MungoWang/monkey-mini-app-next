/** @vitest-environment jsdom */

import { describe, expect, it, afterEach } from 'vitest'

import { useApp, type AppHandle } from '../../src/sdk/use-app.ts'

const realm = globalThis as { miniAppHost?: { useApp: () => AppHandle } }

afterEach(() => {
  delete realm.miniAppHost
})

describe('useApp', () => {
  it('throws outside the host wrapper', () => {
    expect(() => useApp()).toThrow('outside the host wrapper')
  })

  it('delegates to the host wrapper handle', async () => {
    const seen: unknown[] = []
    realm.miniAppHost = {
      useApp: () => ({
        call: (method, args) => Promise.resolve({ method, args }),
        streamCall: () => Object.assign(Promise.resolve('done'), {
          async *[Symbol.asyncIterator]() {
            yield 'chunk'
          },
        }),
        on: (name, cb) => {
          seen.push(name)
          cb('ok')
          return () => undefined
        },
        onAny: (cb) => {
          cb({ name: 'tick', data: 1 })
          return () => undefined
        },
        resolveAssetUrl: (path) => `/resolved/${path}`,
      }),
    }
    const handle = useApp()
    await expect(handle.call('ping', { n: 1 })).resolves.toEqual({ method: 'ping', args: { n: 1 } })
    handle.on('progress', (data) => {
      seen.push(data)
    })
    handle.onAny((event) => {
      seen.push(event)
    })
    expect(handle.resolveAssetUrl('./assets/mark.svg')).toBe('/resolved/./assets/mark.svg')
    expect(seen).toEqual(['progress', 'ok', { name: 'tick', data: 1 }])
  })
})
