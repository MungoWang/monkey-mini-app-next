import { McpError } from './codes.ts'

/** One configured external server. */
export type McpServerSpec =
  | { command: string; args?: string[]; env?: Record<string, string> }
  | { url: string; transport?: 'sse' | 'streamable-http'; headers?: Record<string, string> }

/**
 * Admit `mcp.json`. A missing value is zero servers. A present invalid value throws.
 * An `mcpServers` wrapper is accepted. An entry named `settings` is skipped.
 * @param value - parsed JSON, or `undefined` when the file is absent
 */
export function resolveMcpConfig(value: unknown): Record<string, McpServerSpec> {
  if (value === undefined) return {}
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new McpError('config-invalid', 'mcp.json must be an object')
  }
  const record = value as Record<string, unknown>
  const source = isObject(record.mcpServers) ? record.mcpServers : record
  const servers: Record<string, McpServerSpec> = {}
  for (const [id, entry] of Object.entries(source)) {
    if (id === 'settings') continue
    if (!isObject(entry)) throw new McpError('config-invalid', `mcp server ${id} must be an object`)
    if (typeof entry.command === 'string') {
      servers[id] = {
        command: entry.command,
        ...Array.isArray(entry.args) ? { args: entry.args.filter((item): item is string => typeof item === 'string') } : {},
        ...isStringRecord(entry.env) ? { env: entry.env } : {},
      }
      continue
    }
    if (typeof entry.url === 'string') {
      const transport = entry.transport === 'sse' || entry.transport === 'streamable-http' ? entry.transport : undefined
      servers[id] = {
        url: entry.url,
        ...transport === undefined ? {} : { transport },
        ...isStringRecord(entry.headers) ? { headers: entry.headers } : {},
      }
      continue
    }
    throw new McpError('config-invalid', `mcp server ${id} needs a command or a url`)
  }
  return servers
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isObject(value) && Object.values(value).every(item => typeof item === 'string')
}
