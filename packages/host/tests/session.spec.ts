import { createServer } from 'node:http'
import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createEchoProvider } from '@mini-app/runtime-provider'
import { describe, expect, it } from 'vitest'

import { registerWithFiles } from './author-seed.ts'
import { ConfigError, createHost, PortInUseError } from '../src/index.ts'

const seed = {
  hostPort: 0,
  theme: 'light' as const,
  palette: 'default',
  locale: 'zh-CN',
}

describe('createHost', () => {
  it('starts the brain only on start, and refuses a busy saved port without rewriting host.json', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-host-'))
    const port = await freePort()
    const provider = createEchoProvider()
    const host = await createHost({ runtimeRoot: root, seed: { ...seed, hostPort: port }, provider })
    expect(provider.healthy()).toBe(false)
    await expect(host.owner.reloadView('com.example.missing')).rejects.toMatchObject({ code: 'app-not-registered' })
    expect(await host.author.invoke('mini_app_list', {})).toMatchObject({ apps: [] })
    expect(await host.owner.list()).toEqual([])
    const written = await host.owner.writePolicy({ ...host.policy, locale: 'en', chatLanguage: 'en' })
    expect(written.restartRequired).toBe(false)
    expect(host.owner.readPolicy().locale).toBe('en')
    expect(host.policy.locale).toBe('en')
    await expect(host.owner.writePolicy({ ...host.policy, locale: 'en', chatLanguage: 'zh-CN' })).rejects.toMatchObject({ code: 'config-invalid' })
    expect(await host.owner.probe('missing')).toMatchObject({ code: 'provider-missing' })
    const posted: unknown[] = []
    const stopFrame = host.bindFrame((message) => {
      posted.push(message)
    })
    host.author.appEvents.push('com.example.app', 'tick', { n: 1 })
    host.author.hostEvents.publish({ type: 'app:reload', appId: 'com.example.app' })
    host.author.hostEvents.publish({ type: 'app:open', appId: 'com.example.app' })
    expect(posted).toEqual([
      { appId: 'com.example.app', name: 'tick', data: { n: 1 }, seq: 1 },
      { type: 'app:reload', appId: 'com.example.app' },
    ])
    stopFrame()
    const replayed: unknown[] = []
    const stopReplay = host.bindFrame((message) => {
      replayed.push(message)
    })
    expect(replayed).toEqual([{ appId: 'com.example.app', name: 'tick', data: { n: 1 }, seq: 1 }])
    stopReplay()
    const postedTree: unknown[] = []
    host.bindFrame((message) => {
      postedTree.push(message)
    })
    await registerWithFiles(host.author, 'com.example.app', {
      'manifest.json': JSON.stringify({
        id: 'com.example.app',
        name: 'Example',
        description: 'One line',
        version: '1',
        entry: 'ui.tsx',
      }),
      'ui.tsx': 'export {}\n',
      'main.api.ts': 'export {}\n',
    })
    await host.author.invoke('mini_app_write', {
      appId: 'com.example.app',
      path: 'note.txt',
      content: 'one\n',
      commit: true,
    })
    expect(postedTree).toContainEqual({ type: 'app:reload', appId: 'com.example.app' })
    const listed = await host.owner.list()
    expect(listed).toMatchObject([{
      id: 'com.example.app',
      name: 'Example',
      description: 'One line',
      version: '1',
      acronym: 'EX',
    }])
    expect(listed[0]?.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    expect(listed[0]?.createdAt).toBe(listed[0]?.updatedAt)
    await expect(host.owner.open('com.example.missing')).rejects.toMatchObject({ code: 'app-not-registered' })
    expect(await host.owner.open('com.example.app', 'Example')).toEqual({ panel: 'notified' })
    await expect(host.owner.restoreStorage('com.example.app')).rejects.toMatchObject({ code: 'storage-migration' })
    expect(await host.owner.list()).toHaveLength(1)
    await host.owner.deleteApp('com.example.app')
    expect(await host.author.invoke('mini_app_list', {})).toMatchObject({ apps: [] })
    expect(await host.owner.listTrash()).toMatchObject([{
      id: 'com.example.app',
      name: 'Example',
      description: 'One line',
      version: '1',
      acronym: 'EX',
    }])
    await expect(host.owner.deleteApp('com.example.app')).rejects.toMatchObject({ code: 'app-not-registered' })
    expect(await host.owner.undeleteApp('com.example.app')).toMatchObject({ id: 'com.example.app' })
    expect(await host.owner.listTrash()).toEqual([])
    expect(await host.owner.list()).toMatchObject([{
      id: 'com.example.app',
      name: 'Example',
      description: 'One line',
      version: '1',
      acronym: 'EX',
    }])
    await expect(host.owner.undeleteApp('com.example.app')).rejects.toMatchObject({ code: 'app-duplicate' })
    await host.owner.deleteApp('com.example.app')
    await expect(host.owner.undeleteApp('com.example.missing')).rejects.toMatchObject({ code: 'app-not-trashed' })
    host.author.appEvents.push('com.example.app', 'tick', { n: 2 })
    expect(posted).toHaveLength(2)
    expect(provider.healthy()).toBe(false)
    const started = await host.start()
    expect(started.port).toBe(port)
    expect(provider.healthy()).toBe(true)
    const other = createEchoProvider()
    const secondRoot = await mkdtemp(join(tmpdir(), 'mma-host-2-'))
    await writeFile(join(secondRoot, 'host.json'), JSON.stringify({
      runtimeRoot: secondRoot,
      hostPort: port,
      theme: 'light',
      palette: 'default',
      locale: 'zh-CN',
      chatLanguage: 'zh-CN',
      llm: null,
      runtimeProvider: { id: 'echo' },
    }))
    const second = await createHost({ runtimeRoot: secondRoot, seed: { ...seed, hostPort: port }, provider: other })
    expect(second.policy.hostPort).toBe(port)
    const failure = await second.start().then(
      () => null,
      (error: unknown) => error,
    )
    expect(failure).toBeInstanceOf(PortInUseError)
    expect(failure).toMatchObject({ busyPort: port, code: 'port-in-use' })
    expect(second.policy.hostPort).toBe(port)
    expect(other.healthy()).toBe(false)
    expect(provider.healthy()).toBe(true)
    await second.dispose()
    await host.dispose()
    expect(provider.healthy()).toBe(false)
  })

  it('refuses a provider that is not the one in host.json before starting', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-host-bad-'))
    await writeFile(join(root, 'host.json'), JSON.stringify({
      runtimeRoot: root,
      hostPort: 18080,
      theme: 'light',
      palette: 'default',
      locale: 'zh-CN',
      chatLanguage: 'zh-CN',
      llm: null,
      runtimeProvider: { id: 'other' },
    }))
    const provider = createEchoProvider()
    await expect(createHost({ runtimeRoot: root, seed, provider })).rejects.toBeInstanceOf(ConfigError)
    expect(provider.healthy()).toBe(false)
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
