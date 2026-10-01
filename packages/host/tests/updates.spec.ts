import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { afterEach, describe, expect, it, vi } from 'vitest'

import { checkPackageUpdate, newestTarball, stagePackageUpdate } from '../src/http/updates.ts'

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

  it('picks a newer local tarball and stages that install', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-update-'))
    const packs = join(root, 'packs')
    await writeFile(join(root, 'package.json'), JSON.stringify({
      name: 'mohou-app',
      mohou: { channel: 'tarball', tarballDir: packs },
      dependencies: { '@mini-app/shell': 'file:old.tgz' },
    }))
    const { mkdir } = await import('node:fs/promises')
    await mkdir(packs)
    await writeFile(join(packs, 'mini-app-shell-1.2.0.tgz'), '')
    await writeFile(join(packs, 'mini-app-shell-1.0.0.tgz'), '')
    expect(newestTarball(packs, 'shell')).toBe('1.2.0')
    const found = await checkPackageUpdate(
      { name: '@mini-app/shell', current: '1.0.0', platform: 'darwin', private: false },
      {},
      root,
    )
    expect(found.updateAvailable).toBe(true)
    expect(found.channel).toBe('tarball')
    expect(found.installable).toBe(true)
    stagePackageUpdate('1.2.0', {}, root)
    const staged = JSON.parse(await readFile(join(root, 'update.json'), 'utf8')) as { args: string[] }
    expect(staged.args[0]).toBe('install')
    expect(staged.args.some(arg => arg.includes('mini-app-shell-1.2.0.tgz'))).toBe(true)
    expect(staged.args).toContain('--omit=peer')
    expect(staged.args).toContain('--fetch-retries=1')
    expect(newestTarball(join(root, 'missing'), 'shell')).toBeNull()
    expect(() => { stagePackageUpdate('1.0.0', {}, join(tmpdir(), 'mma-no-prefix')) }).toThrow(/app prefix/)
    await writeFile(join(root, 'package.json'), JSON.stringify({
      name: 'mohou-app',
      mohou: { channel: 'registry' },
      dependencies: {},
    }))
    stagePackageUpdate('2.0.0', {}, root)
    const registry = JSON.parse(await readFile(join(root, 'update.json'), 'utf8')) as { args: string[] }
    expect(registry.args).toContain('@mini-app/shell@2.0.0')
    expect(registry.args).toContain('--omit=peer')
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 503, json: async () => ({}) })))
    const same = await checkPackageUpdate(
      { name: '@mini-app/shell', current: '9.0.0', platform: 'darwin', private: false },
      {},
      root,
    )
    expect(same.channel).toBe('registry')
    expect(same.installable).toBe(true)
  })
})
