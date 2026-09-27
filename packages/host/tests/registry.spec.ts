import { mkdir, mkdtemp, readdir, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { RegistryError, createAppRegistry } from '../src/index.ts'

const files = {
  'manifest.json': JSON.stringify({
    id: 'com.example.app',
    name: 'Example',
    description: 'One line',
    version: '1',
    entry: 'ui.tsx',
  }),
  'ui.tsx': 'export {}',
  'main.api.ts': 'export {}',
}

describe('createAppRegistry', () => {
  it('registers, lists, and refuses a duplicate or an escaping path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-apps-'))
    const registry = createAppRegistry(root)
    expect(await registry.list()).toEqual({ apps: [], runtimeRoot: root })
    const created = await registry.register('com.example.app', files)
    expect(created.directory).toBe(join(root, 'apps', 'com.example.app'))
    expect((await registry.get('com.example.app')).name).toBe('Example')
    await expect(registry.register('com.example.app', files)).rejects.toBeInstanceOf(RegistryError)
    await expect(registry.register('com.example.other', { ...files, '../x': 'no' })).rejects.toMatchObject({ code: 'path-escape' })
    expect((await registry.list()).apps).toHaveLength(1)
    await expect(registry.get('nope')).rejects.toMatchObject({ code: 'app-id-invalid' })
    await expect(registry.get('com.example.missing')).rejects.toMatchObject({ code: 'app-not-registered' })
  })

  it('skips trash names that are not an app copy', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-trash-'))
    const registry = createAppRegistry(root)
    await registry.register('com.example.app', files)
    await registry.trash('com.example.app')
    const trash = join(root, 'trash')
    await mkdir(join(trash, 'not-an-id_stamp'))
    await mkdir(join(trash, 'com.example.app_'))
    await mkdir(join(trash, '_stamp'))
    const listed = await registry.listTrash()
    expect(listed).toHaveLength(1)
    expect(listed[0]?.id).toBe('com.example.app')
    await expect(registry.restoreTrashed('com.example.missing')).rejects.toMatchObject({ code: 'app-not-trashed' })
    await expect(registry.list()).resolves.toMatchObject({ apps: [] })
    const empty = createAppRegistry(await mkdtemp(join(tmpdir(), 'mma-trash-empty-')))
    await expect(empty.restoreTrashed('com.example.app')).rejects.toMatchObject({ code: 'app-not-trashed' })
    expect(await empty.listTrash()).toEqual([])
    const beta = {
      ...files,
      'manifest.json': JSON.stringify({
        id: 'com.example.beta',
        name: 'Beta',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
      }),
    }
    await registry.register('com.example.app', files)
    await registry.trash('com.example.app')
    await registry.restoreTrashed('com.example.app')
    await registry.trash('com.example.app')
    await registry.register('com.example.beta', beta)
    await registry.trash('com.example.beta')
    const both = await registry.listTrash()
    expect(both.map(item => item.id)).toEqual(['com.example.app', 'com.example.beta'])
  })

  it('clears a failed register and keeps the live app when restore would collide', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-reg-fail-'))
    const registry = createAppRegistry(root)
    await expect(registry.register('com.example.app', { ...files, 'manifest.json': '{' })).rejects.toThrow()
    const apps = join(root, 'apps')
    expect((await readdir(apps)).some(name => name.startsWith('.registering-'))).toBe(false)
    await expect(registry.trash('com.example.app')).rejects.toMatchObject({ code: 'app-not-registered' })
    const named = {
      ...files,
      'manifest.json': JSON.stringify({
        id: 'com.example.app',
        name: '\u793a\u4f8b',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
        acronym: 'zx',
      }),
    }
    expect((await registry.register('com.example.app', named)).acronym).toBe('ZX')
    await mkdir(join(apps, 'com.example.junk'))
    await writeFile(join(apps, 'com.example.junk', 'manifest.json'), '{', 'utf8')
    expect((await registry.list()).apps.map(item => item.id)).toEqual(['com.example.app'])
    await registry.trash('com.example.app')
    await registry.register('com.example.app', named)
    await expect(registry.restoreTrashed('com.example.app')).rejects.toMatchObject({ code: 'app-duplicate' })
    expect((await registry.listTrash()).map(item => item.id)).toContain('com.example.app')
    const trash = join(root, 'trash')
    await mkdir(join(trash, 'com.example.empty_1'))
    await expect(registry.restoreTrashed('com.example.empty')).rejects.toMatchObject({ code: 'app-not-trashed' })
    await expect(registry.get('com.example.empty')).rejects.toMatchObject({ code: 'app-not-registered' })
  })

  it('keeps unique manifest tags on the summary', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-tags-'))
    const registry = createAppRegistry(root)
    const tagged = {
      ...files,
      'manifest.json': JSON.stringify({
        id: 'com.example.app',
        name: 'Example',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
        tags: ['desk', 'desk', 'tools'],
      }),
    }
    expect((await registry.register('com.example.app', tagged)).tags).toEqual(['desk', 'tools'])
    expect((await registry.list()).apps[0]?.tags).toEqual(['desk', 'tools'])
  })
})
