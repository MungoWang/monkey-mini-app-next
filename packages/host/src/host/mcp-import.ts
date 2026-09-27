import { McpError } from '@mini-app/mcp-client'

import type { McpEditorServer } from './mcp-editor.ts'

const commandKeys = ['command', 'cmd'] as const
const urlKeys = ['url', 'serverUrl', 'baseUrl', 'endpoint'] as const

/**
 * Turn pasted or file text into editor servers.
 * A fragment without braces is wrapped. A map, an `mcpServers` object, and one server object are accepted.
 * Other editors' field names are mapped onto command, args, url, and env.
 */
export function admitMcpText(raw: string): McpEditorServer[] {
  const text = brace(stripFence(raw.trim()))
  if (text.length === 0) throw new McpError('config-invalid', 'mcp import is empty')
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch (error) {
    throw new McpError('config-invalid', 'mcp import is not JSON', { cause: error })
  }
  return admitParsed(parsed)
}

function admitParsed(value: unknown): McpEditorServer[] {
  if (Array.isArray(value)) return value.flatMap((item, index) => oneServer(item, `server-${index + 1}`))
  if (!isRecord(value)) throw new McpError('config-invalid', 'mcp import must be an object')
  const wrapped = isRecord(value.mcpServers) ? value.mcpServers : value
  if (isServerEntry(wrapped)) return oneServer(wrapped, nameOf(wrapped) ?? 'imported')
  const servers: McpEditorServer[] = []
  for (const [id, entry] of Object.entries(wrapped)) {
    if (id === 'settings') continue
    servers.push(...oneServer(entry, id))
  }
  if (servers.length === 0) throw new McpError('config-invalid', 'mcp import has no servers')
  return servers
}

function oneServer(value: unknown, fallbackId: string): McpEditorServer[] {
  if (!isRecord(value)) return []
  const id = (nameOf(value) ?? fallbackId).trim()
  if (id.length === 0 || id === 'settings') return []
  const command = stringField(value, commandKeys)
  const url = stringField(value, urlKeys)
  const kind = transportOf(value.transport ?? value.type)
  const args = argsOf(value.args ?? value.arguments ?? value.arg)
  const env = recordOf(value.env ?? value.environment ?? value.envVars)
  const headers = recordOf(value.headers)
  const description = descriptionOf(value)
  const note = description === undefined ? {} : { description }
  const remote = kind === 'sse' || kind === 'http' || (url !== undefined && command === undefined)
  if (remote && url !== undefined) {
    return [flagged({
      id,
      url,
      transport: kind === 'sse' ? 'sse' : 'streamable-http',
      ...headers === undefined ? {} : { headers },
      ...env === undefined ? {} : { env },
      ...note,
    }, value)]
  }
  if (command === undefined) return []
  return [flagged({
    id,
    command,
    ...args === undefined ? {} : { args },
    ...env === undefined ? {} : { env },
    ...note,
  }, value)]
}

function flagged(server: McpEditorServer, value: Record<string, unknown>): McpEditorServer {
  return value.disabled === true || value.enabled === false ? { ...server, enabled: false } : server
}

function nameOf(value: Record<string, unknown>): string | undefined {
  if (typeof value.name === 'string' && value.name.trim().length > 0) return value.name.trim()
  return undefined
}

function isServerEntry(value: Record<string, unknown>): boolean {
  return stringField(value, [...commandKeys, ...urlKeys]) !== undefined || value.transport !== undefined || value.type !== undefined
}

function descriptionOf(value: Record<string, unknown>): string | undefined {
  if (typeof value.description === 'string' && value.description.trim().length > 0) return value.description.trim()
  const meta = value._monkeyagent
  if (!isRecord(meta) || typeof meta.description !== 'string') return undefined
  const text = meta.description.trim()
  return text.length === 0 ? undefined : text
}

function transportOf(value: unknown): 'stdio' | 'sse' | 'http' | undefined {
  if (typeof value !== 'string') return undefined
  const text = value.trim().toLowerCase()
  if (text === 'stdio' || text === 'local' || text.startsWith('stdio')) return 'stdio'
  if (text === 'sse' || text.startsWith('sse')) return 'sse'
  if (text === 'http' || text.startsWith('http') || text === 'streamable-http' || text === 'streamable_http') return 'http'
  return undefined
}

function stringField(value: Record<string, unknown>, keys: readonly string[]): string | undefined {
  for (const key of keys) {
    const item = value[key]
    if (typeof item === 'string' && item.trim().length > 0) return item.trim()
  }
  return undefined
}

function argsOf(value: unknown): string[] | undefined {
  if (typeof value === 'string') {
    const args = value.split(/\s+/).filter(item => item.length > 0)
    return args.length === 0 ? undefined : args
  }
  if (!Array.isArray(value)) return undefined
  const args = value.filter((item): item is string => typeof item === 'string' && item.length > 0)
  return args.length === 0 ? undefined : args
}

function recordOf(value: unknown): Record<string, string> | undefined {
  if (!isRecord(value)) return undefined
  const record: Record<string, string> = {}
  for (const [key, item] of Object.entries(value)) {
    if (typeof item === 'string') record[key] = item
  }
  return Object.keys(record).length === 0 ? undefined : record
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function stripFence(text: string): string {
  const fenced = text.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return (fenced?.[1] ?? text).trim()
}

function brace(text: string): string {
  if (text.startsWith('{') || text.startsWith('[')) return text
  return `{${text}}`
}
