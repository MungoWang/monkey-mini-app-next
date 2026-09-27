import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkPackageUpdate } from '../src/http/updates.ts'

afterEach(() => {
  vi.unstubAllGlobals()
})

const published = { name: '@mini-app/host', current: '0.0.0', platform: 'darwin', private: false }

describe('checkPackageUpdate', () => {
  it('reports a newer registry version and a failed lookup', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ version: '9.9.9' }),
    })))
    const newer = await checkPackageUpdate(published)
    expect(newer.latest).toBe('9.9.9')
    expect(newer.updateAvailable).toBe(true)
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 404, json: async () => ({}) })))
    const missing = await checkPackageUpdate(published)
    expect(missing.error).toContain('404')
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw new Error('offline')
    }))
    const failed = await checkPackageUpdate(published)
    expect(failed.error).toBe('offline')
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ version: 1 }) })))
    const unversioned = await checkPackageUpdate(published)
    expect(unversioned.latest).toBeNull()
    expect(unversioned.updateAvailable).toBe(false)
    vi.stubGlobal('fetch', vi.fn(async () => {
      throw 'offline'
    }))
    expect((await checkPackageUpdate(published)).error).toBe('update check failed')
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const local = await checkPackageUpdate({ ...published, private: true })
    expect(local.latest).toBe('0.0.0')
    expect(local.updateAvailable).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
