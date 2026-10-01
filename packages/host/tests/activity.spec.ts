import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { registerWithFiles } from './author-seed.ts'
import { McpClient } from '@mohou/mcp-client'
import { createEchoProvider } from '@mohou/runtime-provider'

import {
  ActivityError,
  createAppRegistry,
  createAuthorTools,
  emptyCredentials,
  readActivity,
  recordOpen,
  type AuthorCallPorts,
} from '../src/index.ts'
import { hostActivityPath } from '../src/host/layout.ts'

describe('activity', () => {
  it('records heat for an open and keeps another app', () => {
    const root = mkdtempSync(join(tmpdir(), 'mma-activity-'))
    expect(readActivity(root)).toEqual({ apps: {} })
    recordOpen(root, 'com.example.app', '2026-09-20T02:00:00.000Z')
    recordOpen(root, 'com.example.app', '2026-09-20T01:00:00.000Z')
    recordOpen(root, 'com.example.other', '2026-09-20T03:00:00.000Z')
    expect(readActivity(root)).toEqual({
      apps: {
        'com.example.app': { openCount: 2, lastOpenedAt: '2026-09-20T02:00:00.000Z' },
        'com.example.other': { openCount: 1, lastOpenedAt: '2026-09-20T03:00:00.000Z' },
      },
    })
    writeFileSync(hostActivityPath(root), '{')
    expect(() => readActivity(root)).toThrow(ActivityError)
    try {
      readActivity(root)
    } catch (error) {
      expect((error as ActivityError).code).toBe('activity-invalid')
    }
  })

  it('writes heat when an app opens and does not write when the app is missing', async () => {
    const root = mkdtempSync(join(tmpdir(), 'mma-activity-open-'))
    const author = createAuthorTools({
      registry: createAppRegistry(root),
      mcp: new McpClient({}),
      now: () => '2026-09-20T04:00:00.000Z',
      ports: ports(),
    })
    await registerWithFiles(author, 'com.example.app', {
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
    await expect(author.invoke('mini_app_open', { appId: 'com.example.missing' })).rejects.toMatchObject({ code: 'app-not-registered' })
    expect(readActivity(root)).toEqual({ apps: {} })
    expect(await author.invoke('mini_app_open', { appId: 'com.example.app' })).toEqual({ panel: 'no-panel-connected' })
    expect(readActivity(root).apps['com.example.app']).toEqual({
      openCount: 1,
      lastOpenedAt: '2026-09-20T04:00:00.000Z',
    })
  })
})

function ports(): AuthorCallPorts {
  return {
    credentials: emptyCredentials(),
    config: {
      theme: 'light',
      palette: 'default',
      locale: 'en',
      chatLanguage: 'en',
      hostPort: 0,
      llm: null,
    },
    log() {},
    push() {},
    http: () => Promise.reject(new Error('unused')),
    bash: () => Promise.reject(new Error('unused')),
    pwsh: () => Promise.reject(new Error('unused')),
    metrics: () => Promise.reject(new Error('unused')),
    processDirectory: tmpdir(),
    createTemp: () => tmpdir(),
    provider: createEchoProvider(),
  }
}
