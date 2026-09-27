import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { commitApp, createAppRegistry, createOwnerReads, openStorage, resetApp } from '../src/index.ts'

describe('owner reads', () => {
  it('reads storage and history without mounting HTTP', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-owner-'))
    const registry = createAppRegistry(root)
    await registry.register('com.example.app', {
      'manifest.json': JSON.stringify({
        id: 'com.example.app',
        name: 'Example',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
      }),
      'ui.tsx': 'export {}',
      'main.api.ts': 'export {}\n',
    })
    const owner = createOwnerReads(registry, 1)
    const app = await registry.get('com.example.app')
    expect(await owner.readStorage('com.example.app')).toEqual({ bytes: 0, tables: [] })
    const storage = await openStorage(app.directory)
    await storage.connect().kv().set('n', { ok: true })
    storage.close()
    const summary = await owner.readStorage('com.example.app')
    expect(summary.tables).toContain('kv')
    expect(summary.bytes).toBeGreaterThan(0)
    const table = await owner.readTable('com.example.app', 'kv')
    expect(table.rows).toEqual([{ key: 'n', value: { ok: true } }])
    await expect(owner.readTable('com.example.app', 'missing')).rejects.toMatchObject({ code: 'storage-forbidden' })
    const reopened = await openStorage(app.directory)
    await reopened.connect().kv().set('m', 2)
    reopened.close()
    await expect(owner.readTable('com.example.app', 'kv')).rejects.toMatchObject({ code: 'storage-too-large' })
    await writeFile(join(app.directory, 'note.txt'), 'one\n')
    const first = await commitApp(app.directory, 'one')
    await writeFile(join(app.directory, 'note.txt'), 'two\n')
    const second = await commitApp(app.directory, 'two')
    await resetApp(app.directory, first.id ?? '')
    const history = await owner.readHistory('com.example.app')
    expect(history.map(node => node.id)).toContain(second.id)
    const detail = await owner.readCommit('com.example.app', first.id ?? '')
    expect(detail.message).toBe('one')
    expect(detail.parentIds).toEqual([])
    await expect(owner.readCommit('com.example.app', 'deadbeef')).rejects.toMatchObject({ code: 'history-unknown-commit' })
    await expect(owner.readStorage('com.example.missing')).rejects.toMatchObject({ code: 'app-not-registered' })
  })
})
