import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { readAuthorMcp, revealAuthorMcp, writeAuthorMcp } from '../src/host/author-mcp.ts'

const live = { url: 'http://127.0.0.1:9743/mcp', token: 'secret-token', description: 'Create and edit mini-apps on this machine.' }

describe('author mcp install', () => {
  it('merges mini-app into mcpServers without dropping neighbours', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-'))
    const file = join(root, 'mcp.json')
    await writeFile(file, JSON.stringify({ mcpServers: { other: { command: 'npx' } }, settings: { keep: true } }, null, 2), 'utf8')
    const layout = {
      agents: [{ id: 'pi', label: 'Pi', file, detectDir: root, format: 'mcpServers' as const }],
    }
    const before = await readAuthorMcp(layout, live)
    expect(before.agents[0]).toMatchObject({ installed: false, updateAvailable: false, homePresent: true })
    const wrote = await writeAuthorMcp(layout, ['pi'], live)
    expect(wrote.agents[0]).toMatchObject({ installed: true, updateAvailable: false })
    const saved = JSON.parse(await readFile(file, 'utf8')) as { mcpServers: Record<string, { url?: string }>; settings: { keep: boolean } }
    expect(saved.settings.keep).toBe(true)
    expect(saved.mcpServers.other).toEqual({ command: 'npx' })
    expect(saved.mcpServers['mini-app']?.url).toBe(live.url)
  })

  it('marks a stale token as updateAvailable and writes opencode remote shape', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-oc-'))
    const file = join(root, 'opencode.jsonc')
    await mkdir(root, { recursive: true })
    await writeFile(file, '{\n  // comment\n  "mcp": { "mini-app": { "type": "remote", "url": "http://127.0.0.1:1/mcp", "headers": { "Authorization": "Bearer old" } } }\n}\n', 'utf8')
    const layout = {
      agents: [{ id: 'opencode', label: 'OpenCode', file, detectDir: root, format: 'opencode' as const }],
    }
    expect(await readAuthorMcp(layout, live)).toMatchObject({
      agents: [{ installed: true, updateAvailable: true }],
    })
    await writeAuthorMcp(layout, ['opencode'], live)
    const saved = JSON.parse(await readFile(file, 'utf8')) as { mcp: { 'mini-app': { type: string; url: string } } }
    expect(saved.mcp['mini-app']).toMatchObject({ type: 'remote', url: live.url, enabled: true })
  })

  it('writes the Claude http shape and refuses a dest it does not own', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-claude-'))
    const file = join(root, '.claude.json')
    const layout = {
      agents: [{ id: 'claude', label: 'Claude', file, detectDir: root, format: 'claude' as const }],
    }
    expect(await writeAuthorMcp(layout, [], live)).toMatchObject({ agents: [{ installed: false }] })
    await writeAuthorMcp(layout, ['claude'], live)
    const saved = JSON.parse(await readFile(file, 'utf8')) as { mcpServers: { 'mini-app': { type: string } } }
    expect(saved.mcpServers['mini-app']).toMatchObject({ type: 'http', url: live.url })
    await expect(revealAuthorMcp(layout, join(root, 'nope.json'))).rejects.toMatchObject({ code: 'config-invalid' })
    await expect(revealAuthorMcp(layout, file, 'linux')).rejects.toMatchObject({ code: 'config-invalid' })
    await writeFile(file, 'not json', 'utf8')
    await expect(writeAuthorMcp(layout, ['claude'], live)).rejects.toMatchObject({ code: 'config-invalid' })
  })
})
