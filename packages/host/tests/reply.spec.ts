import type { Context } from 'hono'
import { describe, expect, it } from 'vitest'

import { errorBody, isPin, mergePolicy, ok } from '../src/http/reply.ts'

describe('loopback reply', () => {
  it('merges a public write without dropping the runtime root or a kept provider config', () => {
    const kept = mergePolicy(
      { runtimeRoot: '/tmp/root', runtimeProvider: { id: 'echo', config: { model: 'm' } } },
      { locale: 'en' },
    )
    expect(kept.runtimeRoot).toBe('/tmp/root')
    expect(kept.runtimeProvider).toMatchObject({ id: 'echo', config: { model: 'm' } })
    const replaced = mergePolicy(
      { runtimeProvider: { id: 'echo' } },
      { runtimeProvider: { id: 'other', config: { model: 'n' } } },
    )
    expect(replaced.runtimeProvider).toEqual({ id: 'other', config: { model: 'n' } })
    expect(mergePolicy(null, { locale: 'en' }).locale).toBe('en')
    expect(isPin({ kind: 'default' })).toBe(true)
    expect(isPin({ kind: 'follow-host' })).toBe(true)
    expect(isPin({ kind: 'app-file' })).toBe(true)
    expect(isPin({ kind: 'palette', id: 'slate' })).toBe(true)
    expect(isPin({ kind: 'palette' })).toBe(false)
    expect(isPin({ kind: 'nope' })).toBe(false)
    expect(isPin(null)).toBe(false)
    expect(errorBody('x')).toEqual({ code: 'failed', message: 'request failed' })
    expect(errorBody(Object.assign(new Error('bad'), { code: 'config-invalid' })).code).toBe('config-invalid')
  })

  it('returns the work result and the thrown code', async () => {
    const success = await ok(jsonContext(), async () => ({ n: 1 }))
    expect(await success.json()).toEqual({ ok: true, result: { n: 1 } })
    const failed = await ok(jsonContext(), () => Promise.reject(new Error('nope')))
    expect(failed.status).toBe(400)
  })
})

function jsonContext(): Context {
  return {
    json(body: unknown, status?: number) {
      return new Response(JSON.stringify(body), { status: status ?? 200 })
    },
  } as Context
}
