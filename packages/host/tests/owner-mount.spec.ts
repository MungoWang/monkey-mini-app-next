import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import type { HostEnv } from '../src/http/env.ts'
import { httpLayout } from '../src/http/layout.ts'
import { mountOwner } from '../src/http/owner.ts'
import type { LoopbackPorts } from '../src/http/ports.ts'

function basePorts(extra: Record<string, unknown> = {}): LoopbackPorts {
  return {
    list: async () => [],
    listTrash: async () => [],
    deleteApp: async () => undefined,
    undeleteApp: async () => ({}),
    open: async () => ({}),
    reload: async () => undefined,
    call: async () => undefined,
    readPolicy: () => ({
      runtimeRoot: '/tmp',
      hostPort: 9743,
      theme: 'light',
      palette: 'default',
      locale: 'en',
      chatLanguage: 'en',
      llm: null,
      runtimeProvider: { id: 'echo' },
    }),
    writePolicy: async (policy: unknown) => ({ policy: policy as never, restartRequired: false }),
    probe: async () => ({ healthy: true }),
    providers: [{
      id: 'echo',
      label: 'Echo',
      healthy: () => true,
      describe: () => [{ kind: 'secret', name: 'token' }],
      models: async () => [{ provider: 'echo', models: ['echo'] }],
      llm: async () => 'x',
      agent: async () => 'x',
      start: async () => undefined,
      stop: async () => undefined,
    }],
    listPalettes: async () => ({ palettes: [], ignored: [] }),
    readPin: async () => ({ kind: 'default' }),
    setPin: async (_appId: string, pin: unknown) => pin,
    appFile: async () => false,
    readHistory: async () => [],
    readCommit: async () => ({}),
    readStorage: async () => ({ bytes: 0, tables: [] }),
    readTable: async () => ({ rows: [] }),
    runnerDocument: async () => '',
    entryScript: async () => '',
    stylesheet: async () => '',
    assetFile: async () => ({ bytes: new Uint8Array(), type: 'application/octet-stream' }),
    restoreStorage: async () => undefined,
    readErrors: () => [],
    vendorFile: async () => '',
    authoringToken: 'token',
    authorized: () => true,
    subscribeHost: () => () => undefined,
    subscribeFrames: () => () => undefined,
    subscribeApp: () => () => undefined,
    checkUpdate: async () => ({ name: 'Mohou', current: '1.0.0', latest: '1.0.0', updateAvailable: false }),
    readMcp: async () => [],
    writeMcp: async () => undefined,
    checkMcp: async () => ({ ok: true, tools: [] }),
    admitMcp: () => [],
    importMcp: async () => [],
    ...extra,
  } as unknown as LoopbackPorts
}

async function request(app: Hono<HostEnv>, path: string, init?: RequestInit) {
  const response = await app.request(path, init)
  return { status: response.status, body: await response.text() }
}

describe('mountOwner', () => {
  it('serves a plain panel, painted panel, provider fields, and optional port gaps', async () => {
    const plain = new Hono<HostEnv>()
    mountOwner(plain, basePorts({
      panel: { html: '<!doctype html><html><head></head><body>plain</body></html>', script: 'export {}' },
    }))
    const plainPanel = await request(plain, httpLayout.panel)
    expect(plainPanel.status).toBe(200)
    expect(plainPanel.body).toContain('plain')
    expect((await request(plain, httpLayout.panelScript)).body).toContain('export')

    const painted = new Hono<HostEnv>()
    mountOwner(painted, basePorts({
      panel: {
        html: '<!doctype html><html><head></head><body>paint</body></html>',
        script: 'export {}',
        paint: async () => ({ style: ':root{--x:1}', appearance: 'dark' }),
      },
    }))
    const paintedPanel = await request(painted, httpLayout.panel)
    expect(paintedPanel.body).toContain('data-mode="dark"')
    expect(paintedPanel.body).toContain('--x:1')

    const system = new Hono<HostEnv>()
    mountOwner(system, basePorts({
      panel: {
        html: '<!doctype html><html><head></head><body>sys</body></html>',
        script: 'export {}',
        paint: async () => ({ style: ':root{--y:2}', appearance: 'system' }),
      },
    }))
    expect((await request(system, httpLayout.panel)).body).toContain('prefers-color-scheme')

    const full = new Hono<HostEnv>()
    let restarted = 0
    mountOwner(full, basePorts({
      restart: async () => {
        restarted += 1
      },
      readAuthorSkill: async (dirs?: readonly string[]) => ({
        skillId: 'monkey-mini-app',
        version: '1.0.0',
        agents: [],
        customs: dirs ?? [],
      }),
      writeAuthorSkill: async (agents: readonly string[], dirs: readonly string[]) => ({
        skillId: 'monkey-mini-app',
        version: '1.0.0',
        agents,
        customs: dirs,
      }),
      revealAuthorSkill: async () => undefined,
      readAuthorMcp: async () => ({ agents: [], description: '' }),
      writeAuthorMcp: async (agents: readonly string[], description: string) => ({
        agents: agents.map(id => ({ id, path: `/tmp/${id}` })),
        description,
      }),
      revealAuthorMcp: async () => undefined,
      providers: [
        {
          id: 'bare',
          healthy: () => true,
          llm: async () => 'x',
          agent: async () => 'x',
          start: async () => undefined,
          stop: async () => undefined,
        },
        {
          id: 'echo',
          label: 'Echo',
          healthy: () => true,
          describe: () => [{ kind: 'secret', name: 'token' }],
          models: async () => [{ provider: 'echo', models: ['echo'] }],
          llm: async () => 'x',
          agent: async () => 'x',
          start: async () => undefined,
          stop: async () => undefined,
        },
      ],
    }))
    const providers = await request(full, httpLayout.providers)
    expect(providers.status).toBe(200)
    expect(providers.body).toContain('"id":"bare"')
    expect(providers.body).toContain('"label":"Echo"')
    expect((await request(full, `${httpLayout.authorSkill}?custom=`)).status).toBe(200)
    expect((await request(full, `${httpLayout.authorSkill}?custom=/a%0A/b`)).status).toBe(200)
    expect((await request(full, httpLayout.authorSkill, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentIds: ['pi'], customDirs: ['/x'] }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.authorSkillReveal, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dest: '/tmp' }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.authorMcp)).status).toBe(200)
    expect((await request(full, httpLayout.authorMcp, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ agentIds: ['pi'], description: 'hello' }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.authorMcpReveal, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ dest: '/tmp' }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.restart, { method: 'POST' })).status).toBe(200)
    expect((await request(full, httpLayout.activate, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'echo', config: { model: 'echo' } }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.mcpServers, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        servers: [{
          id: 'remote',
          url: 'https://example.test/mcp',
          transport: 'sse',
          headers: { Authorization: 'Bearer x' },
        }],
      }),
    })).status).toBe(200)
    expect((await request(full, httpLayout.mcpCheck, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: 'remote', url: 'https://example.test/mcp', transport: 'streamable-http' }),
    })).status).toBe(200)
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(restarted).toBe(1)
  })
})
