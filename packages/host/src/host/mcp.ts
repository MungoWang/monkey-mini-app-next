import { readFile } from 'node:fs/promises'

import { McpError, resolveMcpConfig, type McpServerSpec } from '@mini-app/mcp-client'

import { hostMcpPath } from './layout.ts'

/** Explicit config path. Set means that file, not a search of another home. */
export const mcpConfigEnv = 'MINI_APP_MCP_CONFIG'

/**
 * Read MCP servers for Host boot.
 * A missing default file is zero servers. A present bad file, or a missing explicit path, fails boot.
 * @param runtimeRoot - directory that contains the default file
 * @param env - process environment; only {@link mcpConfigEnv} is read
 */
export async function loadMcpServers(
  runtimeRoot: string,
  env: NodeJS.ProcessEnv = process.env,
): Promise<Record<string, McpServerSpec>> {
  const override = env[mcpConfigEnv]
  const explicit = typeof override === 'string' && override.length > 0
  const file = explicit ? override : hostMcpPath(runtimeRoot)
  const text = await readFile(file, 'utf8').catch(() => undefined)
  if (text === undefined) {
    if (explicit) throw new McpError('config-invalid', `mcp config is missing: ${file}`)
    return {}
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (error) {
    throw new McpError('config-invalid', 'mcp config is not JSON', { cause: error })
  }
  return resolveMcpConfig(omitDisabled(parsed))
}

function omitDisabled(value: unknown): unknown {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return value
  const record = value as Record<string, unknown>
  const wrapped = typeof record.mcpServers === 'object' && record.mcpServers !== null && !Array.isArray(record.mcpServers)
  const source = wrapped ? record.mcpServers as Record<string, unknown> : record
  const next: Record<string, unknown> = {}
  for (const [id, entry] of Object.entries(source)) {
    if (typeof entry === 'object' && entry !== null && 'disabled' in entry && entry.disabled === true) continue
    next[id] = entry
  }
  return wrapped ? { ...record, mcpServers: next } : next
}
