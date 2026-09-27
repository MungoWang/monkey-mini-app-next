import { createServer } from 'node:http'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { emptyCredentials } from '@mini-app/host'
import { describe, expect, it } from 'vitest'

import { registerWithFiles } from '../../host/tests/author-seed.ts'
import { bootHost, ownerClients } from '../src/index.ts'

const appId = 'com.example.app'

describe('ownerClients', () => {
  it('calls the in-process owner session and keeps the runtime root off the form', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-clients-'))
    const host = await bootHost({ runtimeRoot: root, hostPort: await freePort(), credentials: emptyCredentials(), seedStartup: false })
    const clients = ownerClients(host)
    expect(await clients.gallery.list()).toEqual([])
    expect(await clients.gallery.listTrash()).toEqual([])
    await registerWithFiles(host.author, appId, {
      'manifest.json': JSON.stringify({
        id: appId,
        name: 'Example',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
      }),
      'ui.tsx': 'export {}\n',
      'main.api.ts': 'export {}\n',
    })
    expect(await clients.gallery.list()).toEqual([
      { id: appId, name: 'Example', description: 'One line', version: '1', acronym: 'EX' },
    ])
    await clients.gallery.open(appId, 'Example')
    await clients.gallery.open(appId)
    await clients.gallery.reload(appId)
    await host.author.invoke('mini_app_write', {
      appId,
      path: 'note.txt',
      content: 'one\n',
      commit: true,
    })
    expect(await clients.storage.readStorage(appId)).toEqual({ bytes: 0, tables: [] })
    expect(await clients.storage.readTable(appId, 'kv')).toEqual({ rows: [] })
    const history = await clients.history.readHistory(appId)
    expect(history.length).toBeGreaterThan(0)
    const first = history[0]
    expect(first).toBeDefined()
    if (first !== undefined) expect((await clients.history.readCommit(appId, first.id)).message).toEqual(expect.any(String))
    const palettes = await clients.theme.listPalettes()
    expect(palettes.ignored).toEqual([])
    expect(await clients.theme.setPin(appId, { kind: 'default' })).toEqual({ kind: 'default' })
    const current = await clients.settings.readPolicy()
    expect(current).not.toHaveProperty('runtimeRoot')
    const saved = await clients.settings.writePolicy({ ...current, palette: 'ink' })
    expect(saved.restartRequired).toBe(false)
    expect(saved.policy.palette).toBe('ink')
    expect(host.owner.readPolicy().runtimeRoot).toBe(root)
    const switched = await clients.settings.writePolicy({
      ...saved.policy,
      runtimeProvider: { id: 'other' },
      defaultWorkbenchId: 'com.example.desk',
    })
    expect(switched.restartRequired).toBe(true)
    expect(switched.policy.defaultWorkbenchId).toBe('com.example.desk')
    expect(await clients.settings.probe('echo')).toMatchObject({ healthy: true })
    await host.dispose()
  })
})

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      const port = typeof address === 'object' && address !== null ? address.port : 0
      server.close((error) => {
        if (error) reject(error)
        else resolve(port)
      })
    })
  })
}
