import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { McpClient, McpError, resolveMcpConfig, type McpServerSpec } from '@mini-app/mcp-client'

import { hostMcpPath } from './layout.ts'
import { admitMcpText } from './mcp-import.ts'
import { mcpConfigEnv } from './mcp.ts'

/** One server the panel may edit. The file shape stays in the MCP client. */
export interface McpEditorServer {
  readonly id: string
  readonly description?: string
  readonly enabled?: boolean
  readonly command?: string
  readonly args?: readonly string[]
  readonly env?: Readonly<Record<string, string>>
  readonly url?: string
  readonly transport?: 'sse' | 'streamable-http'
  readonly headers?: Readonly<Record<string, string>>
}

export interface McpCheck {
  readonly ok: boolean
  readonly tools: readonly { readonly name: string; readonly description?: string }[]
  readonly code?: string
  readonly message?: string
}

/** Servers currently in the file. A missing default file is an empty list. */
export async function readMcpEditor(runtimeRoot: string, env: NodeJS.ProcessEnv = process.env): Promise<McpEditorServer[]> {
  const text = await readFile(mcpFile(runtimeRoot, env), 'utf8').catch(() => undefined)
  if (text === undefined || text.trim().length === 0) return []
  try {
    return admitMcpText(text)
  } catch (error) {
    if (error instanceof McpError && error.message === 'mcp import has no servers') return []
    throw error
  }
}

/**
 * Replace the file with these servers. Invalid rows throw and the file stays.
 * An explicit `MINI_APP_MCP_CONFIG` writes that path.
 */
export async function writeMcpEditor(
  runtimeRoot: string,
  servers: readonly McpEditorServer[],
  env: NodeJS.ProcessEnv = process.env,
): Promise<void> {
  const resolved = editorToConfig(servers)
  const body: Record<string, unknown> = {}
  for (const server of servers) {
    const spec = resolved[server.id]
    if (spec === undefined) continue
    const description = server.description?.trim()
    body[server.id] = {
      ...spec,
      ...description === undefined || description.length === 0 ? {} : { description },
      ...server.enabled === false ? { disabled: true } : {},
    }
  }
  const file = mcpFile(runtimeRoot, env)
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify(body, null, 2)}\n`, 'utf8')
}

/**
 * Open one server and list its tools. Does not write the file.
 * The process is closed before this returns.
 */
export async function checkMcpEditor(server: McpEditorServer, env: NodeJS.ProcessEnv = process.env): Promise<McpCheck> {
  const resolved = editorToConfig([server])
  const client = new McpClient(resolved, env, 0)
  try {
    const tools = await client.listTools(server.id)
    return {
      ok: true,
      tools: tools.map(tool => ({
        name: tool.name,
        ...tool.description === undefined ? {} : { description: tool.description },
      })),
    }
  } catch (error) {
    return {
      ok: false,
      tools: [],
      code: error instanceof McpError ? error.code : 'mcp-start-failed',
      message: error instanceof Error && error.message.length > 0 ? error.message : 'mcp server did not start',
    }
  } finally {
    await client.dispose()
  }
}

export function editorServers(resolved: Record<string, McpServerSpec>): McpEditorServer[] {
  return Object.entries(resolved).map(([id, spec]) => {
    if ('command' in spec) {
      return {
        id,
        command: spec.command,
        ...spec.args === undefined ? {} : { args: spec.args },
        ...spec.env === undefined ? {} : { env: spec.env },
      }
    }
    return {
      id,
      url: spec.url,
      ...spec.transport === undefined ? {} : { transport: spec.transport },
      ...spec.headers === undefined ? {} : { headers: spec.headers },
    }
  })
}

export function editorToConfig(servers: readonly McpEditorServer[]): Record<string, McpServerSpec> {
  const raw: Record<string, unknown> = {}
  for (const server of servers) {
    if (server.id.trim().length === 0) throw new McpError('config-invalid', 'mcp server id is empty')
    raw[server.id] = {
      ...server.command === undefined ? {} : { command: server.command },
      ...server.args === undefined ? {} : { args: [...server.args] },
      ...server.env === undefined ? {} : { env: { ...server.env } },
      ...server.url === undefined ? {} : { url: server.url },
      ...server.transport === undefined ? {} : { transport: server.transport },
      ...server.headers === undefined ? {} : { headers: { ...server.headers } },
    }
  }
  return resolveMcpConfig(raw)
}

/** Read one import file. Shell chooses the path. Host does not name another product's home. */
export async function readMcpImport(file: string): Promise<McpEditorServer[]> {
  const text = await readFile(file, 'utf8').catch(() => undefined)
  if (text === undefined) throw new McpError('config-invalid', `mcp import is missing: ${file}`)
  return admitMcpText(text)
}

function mcpFile(runtimeRoot: string, env: NodeJS.ProcessEnv): string {
  const override = env[mcpConfigEnv]
  return typeof override === 'string' && override.length > 0 ? override : hostMcpPath(runtimeRoot)
}
