import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { request } from 'node:http'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { createEchoProvider } from '@mohou/runtime-provider'
import { describe, expect, it } from 'vitest'

import { createHost } from '../src/host/session.ts'
import { httpLayout } from '../src/http/layout.ts'

describe('author skill and mcp owner routes', () => {
  it('reads and writes dests when Shell injected the tables', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-author-http-'))
    const source = join(root, 'monkey-mini-app')
    const skillsDir = join(root, '.pi', 'agent', 'skills')
    const mcpFile = join(root, '.pi', 'agent', 'mcp.json')
    await mkdir(source)
    await mkdir(join(root, '.pi', 'agent'), { recursive: true })
    await writeFile(join(source, 'SKILL.md'), '---\nversion: 1.0.2\n---\n# skill\n', 'utf8')
    await writeFile(mcpFile, '{}\n', 'utf8')
    const host = await createHost({
      runtimeRoot: root,
      seed: { hostPort: 0, theme: 'light', palette: 'default', locale: 'en' },
      provider: createEchoProvider(),
      authorSkill: {
        source,
        agents: [{ id: 'pi', label: 'Pi', skillsDir, detectDir: join(root, '.pi', 'agent') }],
      },
      authorMcp: {
        agents: [{ id: 'pi', label: 'Pi', file: mcpFile, detectDir: join(root, '.pi', 'agent'), format: 'mcpServers' }],
      },
    })
    const started = await host.start()
    try {
      const skill = objectBody((await get(started.port, httpLayout.authorSkill)).body)
      expect(skill).toMatchObject({ ok: true, result: { skillId: 'monkey-mini-app', version: '1.0.2' } })
      const wroteSkill = objectBody((await post(started.port, httpLayout.authorSkill, JSON.stringify({ agentIds: ['pi'], customDirs: [] }))).body)
      expect(wroteSkill).toMatchObject({ ok: true, result: { agents: [{ installed: true }] } })
      const mcp = objectBody((await get(started.port, httpLayout.authorMcp)).body)
      expect(mcp).toMatchObject({ ok: true, result: { agents: [{ id: 'pi', installed: false }] } })
      const wroteMcp = objectBody((await post(started.port, httpLayout.authorMcp, JSON.stringify({ agentIds: ['pi'], description: 'Create and edit mini-apps on this machine.' }))).body)
      expect(wroteMcp).toMatchObject({ ok: true, result: { agents: [{ installed: true, updateAvailable: false }] } })
      const listed = objectBody((await get(started.port, httpLayout.mcpServers)).body)
      expect(listed).toMatchObject({ ok: true, result: { servers: [] } })
      const saved = await post(started.port, httpLayout.mcpServers, JSON.stringify({ servers: [{ id: 'echo', command: 'echo', args: ['hi'] }] }))
      expect(objectBody(saved.body).ok).toBe(true)
      const check = await post(started.port, httpLayout.mcpCheck, JSON.stringify({ id: 'missing', command: 'mini-app-no-such-mcp-bin' }))
      expect(objectBody(check.body)).toMatchObject({ ok: true, result: { ok: false, code: 'mcp-start-failed' } })
      const admitted = await post(started.port, httpLayout.mcpAdmit, JSON.stringify({ text: '{"from":{"command":"npx"}}' }))
      expect(objectBody(admitted.body)).toMatchObject({ ok: true, result: { servers: [{ id: 'from' }] } })
      expect((await post(started.port, httpLayout.mcpAdmit, '{')).status).toBe(400)
      expect((await post(started.port, httpLayout.mcpServers, JSON.stringify({ servers: [{ id: 'bad', args: [1] }] }))).status).toBe(400)
      expect((await post(started.port, httpLayout.mcpServers, JSON.stringify({ servers: [{ id: 'bad', env: { K: 1 } }] }))).status).toBe(400)
      expect((await post(started.port, httpLayout.mcpServers, JSON.stringify({ servers: 'nope' }))).status).toBe(400)
      expect((await post(started.port, httpLayout.mcpCheck, JSON.stringify({ command: 'echo' }))).status).toBe(400)
      expect((await post(started.port, httpLayout.mcpCheck, 'null')).status).toBe(400)
      expect((await post(started.port, httpLayout.hostConfig, 'null')).status).toBe(400)
      expect((await post(started.port, httpLayout.activate, '{}')).status).toBe(400)
      expect((await post(started.port, httpLayout.probe, '{}')).status).toBe(400)
      expect((await post(started.port, httpLayout.authorSkillReveal, JSON.stringify({ dest: join(skillsDir, 'nope') }))).status).toBe(400)
      expect((await post(started.port, httpLayout.authorMcpReveal, JSON.stringify({ dest: join(root, 'nope.json') }))).status).toBe(400)
    } finally {
      await host.dispose()
    }
  }, 120_000)

  it('rejects author dest routes when Shell did not inject them', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-author-http-off-'))
    const host = await createHost({
      runtimeRoot: root,
      seed: { hostPort: 0, theme: 'light', palette: 'default', locale: 'en' },
      provider: createEchoProvider(),
    })
    const started = await host.start()
    try {
      expect((await get(started.port, httpLayout.authorSkill)).status).toBe(400)
      expect((await post(started.port, httpLayout.authorSkill, '{}')).status).toBe(400)
      expect((await post(started.port, httpLayout.authorSkillReveal, '{}')).status).toBe(400)
      expect((await get(started.port, httpLayout.authorMcp)).status).toBe(400)
      expect((await post(started.port, httpLayout.authorMcp, '{}')).status).toBe(400)
      expect((await post(started.port, httpLayout.authorMcpReveal, '{}')).status).toBe(400)
      expect((await get(started.port, `${httpLayout.mcpImport}/pi`)).status).toBe(400)
    } finally {
      await host.dispose()
    }
  }, 120_000)
})

function objectBody(body: string): Record<string, unknown> {
  return JSON.parse(body) as Record<string, unknown>
}

function get(port: number, path: string): Promise<{ status: number; body: string }> {
  return call(port, path, 'GET')
}

function post(port: number, path: string, body: string): Promise<{ status: number; body: string }> {
  return call(port, path, 'POST', body)
}

function call(port: number, path: string, method: string, body?: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    const headers: Record<string, string> = {}
    if (body !== undefined) {
      headers['content-type'] = 'application/json'
      headers['content-length'] = String(Buffer.byteLength(body))
    }
    const req = request({
      host: '127.0.0.1',
      port,
      path,
      method,
      headers,
    }, (response) => {
      const chunks: Buffer[] = []
      response.on('data', (chunk: Buffer) => {
        chunks.push(chunk)
      })
      response.on('end', () => {
        resolve({ status: response.statusCode ?? 0, body: Buffer.concat(chunks).toString('utf8') })
      })
    })
    req.on('error', reject)
    if (body !== undefined) req.write(body)
    req.end()
  })
}
