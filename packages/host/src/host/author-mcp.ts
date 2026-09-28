import { spawn } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { ConfigError } from './codes.ts'

export const authorMcpServerId = 'mini-app'

export type AuthorMcpFormat = 'mcpServers' | 'claude' | 'opencode'

/** One assistant file Shell named. */
export interface AuthorMcpAgent {
  readonly id: string
  readonly label: string
  readonly file: string
  readonly detectDir: string
  readonly format: AuthorMcpFormat
  readonly adapter?: string
}

export interface AuthorMcpLayout {
  readonly agents: readonly AuthorMcpAgent[]
}

export interface AuthorMcpLive {
  readonly url: string
  readonly token: string
  readonly description: string
}

export interface AuthorMcpAgentStatus extends AuthorMcpAgent {
  readonly dest: string
  readonly homePresent: boolean
  readonly installed: boolean
  readonly updateAvailable: boolean
}

export interface AuthorMcpStatus {
  readonly agents: readonly AuthorMcpAgentStatus[]
}

export async function readAuthorMcp(layout: AuthorMcpLayout, live: AuthorMcpLive): Promise<AuthorMcpStatus> {
  const agents = await Promise.all(layout.agents.map(async (agent) => {
    const installed = await hasServer(agent, live)
    return {
      ...agent,
      dest: agent.file,
      homePresent: await present(agent.detectDir),
      installed: installed.ok,
      updateAvailable: installed.ok && !installed.current,
    }
  }))
  return { agents }
}

/**
 * Merge the live authoring server into each selected assistant file.
 * Other servers in that file stay.
 */
export async function writeAuthorMcp(
  layout: AuthorMcpLayout,
  agentIds: readonly string[],
  live: AuthorMcpLive,
): Promise<AuthorMcpStatus> {
  const selected = layout.agents.filter(agent => agentIds.includes(agent.id))
  for (const agent of selected) await writeAgent(agent, live)
  return readAuthorMcp(layout, live)
}

/** Open a dest this layout already owns. */
export async function revealAuthorMcp(
  layout: AuthorMcpLayout,
  dest: string,
  platform = process.platform,
): Promise<void> {
  const resolved = path.resolve(dest)
  const allowed = new Set(layout.agents.map(agent => path.resolve(agent.file)))
  if (!allowed.has(resolved)) throw new ConfigError('config-invalid', 'mcp file is not in the list')
  await access(resolved)
  await openPath(resolved, platform)
}

async function writeAgent(agent: AuthorMcpAgent, live: AuthorMcpLive): Promise<void> {
  const root = await readRoot(agent.file)
  const key = nestKey(agent.format)
  const nest = isRecord(root[key]) ? { ...root[key] } : {}
  nest[authorMcpServerId] = entryOf(agent.format, live)
  const next = { ...root, [key]: nest }
  await mkdir(path.dirname(agent.file), { recursive: true })
  await writeFile(agent.file, `${JSON.stringify(next, null, 2)}\n`, 'utf8')
}

async function hasServer(agent: AuthorMcpAgent, live: AuthorMcpLive): Promise<{ ok: boolean; current: boolean }> {
  const root = await readRoot(agent.file).catch(() => undefined)
  if (root === undefined) return { ok: false, current: false }
  const nest = root[nestKey(agent.format)]
  if (!isRecord(nest)) return { ok: false, current: false }
  const row = nest[authorMcpServerId]
  if (!isRecord(row)) return { ok: false, current: false }
  const headers = isRecord(row.headers) ? row.headers : {}
  const current = row.url === live.url && headers.Authorization === `Bearer ${live.token}`
  return { ok: true, current }
}

async function readRoot(file: string): Promise<Record<string, unknown>> {
  const text = await readFile(file, 'utf8').catch((error: unknown) => {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') return ''
    throw error
  })
  if (text.trim().length === 0) return {}
  let parsed: unknown
  try {
    parsed = JSON.parse(stripJsonc(text))
  } catch {
    throw new ConfigError('config-invalid', `mcp file is not JSON: ${file}`)
  }
  if (!isRecord(parsed)) throw new ConfigError('config-invalid', `mcp file is not an object: ${file}`)
  return parsed
}

function entryOf(format: AuthorMcpFormat, live: AuthorMcpLive): Record<string, unknown> {
  const headers = { Authorization: `Bearer ${live.token}` }
  if (format === 'opencode') return { type: 'remote', url: live.url, enabled: true, headers }
  if (format === 'claude') return { type: 'http', url: live.url, headers }
  return {
    url: live.url,
    transport: 'streamable-http',
    description: live.description,
    headers,
    _monkeyagent: { description: live.description },
  }
}

function nestKey(format: AuthorMcpFormat): 'mcpServers' | 'mcp' {
  return format === 'opencode' ? 'mcp' : 'mcpServers'
}

function stripJsonc(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/,(\s*[}\]])/g, '$1')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function present(dir: string): Promise<boolean> {
  try {
    await access(dir)
    return true
  } catch {
    return false
  }
}

function openPath(target: string, platform: string): Promise<void> {
  const launched = platform === 'win32'
    ? { command: 'explorer', args: [target] }
    : platform === 'darwin'
      ? { command: 'open', args: [target] }
      : undefined
  if (launched === undefined) throw new ConfigError('config-invalid', `open folder is not implemented on ${platform}`)
  return new Promise((resolve, reject) => {
    const child = spawn(launched.command, launched.args, { stdio: 'ignore', detached: true })
    child.once('error', reject)
    child.unref()
    resolve()
  })
}
