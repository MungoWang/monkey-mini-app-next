import { randomUUID } from 'node:crypto'

import type { Context, Hono } from 'hono'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

import { isAuthorMcpTool, type createAuthorTools } from '../tools/author.ts'
import { AuthorError } from '../tools/codes.ts'
import { authorMcpToolList, authorToolList } from '../tools/schemas.ts'
import type { HostEnv } from './env.ts'
import { authoringTokenMatches } from './guard.ts'
import { httpLayout } from './layout.ts'

type AuthorTools = ReturnType<typeof createAuthorTools>

/** Authoring routes. Every one requires the token. */
export function mountAuthor(app: Hono<HostEnv>, author: AuthorTools, token: string): void {
  app.get(httpLayout.tools, (c) => {
    const denied = rejectToken(c, token)
    if (denied !== undefined) return denied
    return c.json({ tools: authorToolList() })
  })
  app.post(httpLayout.invoke, async (c) => {
    const denied = rejectToken(c, token)
    if (denied !== undefined) return denied
    try {
      const body = record(await c.req.json())
      const result = await author.invoke(requiredString(body, 'name'), body.arguments ?? {})
      return c.json({ ok: true, result })
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'tool-args'
      const message = error instanceof Error ? error.message : 'tool failed'
      return c.json({ ok: false, error: { code, message } }, 400)
    }
  })
  app.all(httpLayout.mcp, async (c) => {
    const denied = rejectToken(c, token)
    if (denied !== undefined) return denied
    if (c.req.method !== 'POST' && c.req.method !== 'GET' && c.req.method !== 'DELETE') {
      return c.json({ ok: false, error: { code: 'unknown-tool', message: 'MCP method is not part of the session lifecycle' } }, 405)
    }
    return handleMcp(author, c.req.raw)
  })
}

function rejectToken(c: Context, token: string): Response | undefined {
  const header = c.req.header('authorization')
  const presented = header?.startsWith('Bearer ') === true ? header.slice('Bearer '.length) : undefined
  if (presented === '' || !authoringTokenMatches(token, presented)) {
    return c.json({ ok: false, error: { code: 'authoring-token', message: 'authoring token is missing or wrong' } }, 401)
  }
  return undefined
}

type McpSession = {
  server: McpServer
  transport: WebStandardStreamableHTTPServerTransport
}

const mcpSessions = new Map<string, McpSession>()

/** Close every stored MCP session. The HTTP listener calls this on close. */
export async function closeMcpSessions(): Promise<void> {
  const open = [...mcpSessions.values()]
  mcpSessions.clear()
  await Promise.all(open.map(async (session) => {
    await session.transport.close()
    await session.server.close()
  }))
}

async function handleMcp(author: AuthorTools, request: Request): Promise<Response> {
  const sessionId = request.headers.get('mcp-session-id')
  if (sessionId !== null && sessionId.length > 0) {
    const found = mcpSessions.get(sessionId)
    if (found === undefined) {
      return Response.json({ ok: false, error: { code: 'unknown-tool', message: 'MCP session is not open' } }, { status: 404 })
    }
    const response = await found.transport.handleRequest(request)
    if (request.method === 'DELETE') {
      mcpSessions.delete(sessionId)
      await found.transport.close()
      await found.server.close()
    }
    return response
  }
  if (request.method !== 'POST') {
    return Response.json({ ok: false, error: { code: 'unknown-tool', message: 'MCP session is not open' } }, { status: 404 })
  }
  const stateful = wantsSession(request)
  const session = openMcpSession(author, stateful)
  await session.server.connect(session.transport)
  const incoming = stateful ? withJsonAccept(request) : request
  const response = await session.transport.handleRequest(incoming)
  const opened = response.headers.get('mcp-session-id')
  if (opened !== null && opened.length > 0) mcpSessions.set(opened, session)
  else {
    await session.transport.close()
    await session.server.close()
  }
  return response
}

/** SSE-only Accept opens a session. A POST that also lists JSON stays stateless. */
function wantsSession(request: Request): boolean {
  const accept = request.headers.get('accept') ?? ''
  return accept.includes('text/event-stream') && !accept.includes('application/json')
}

/** The SDK POST handler requires both Accept types. Session open still uses SSE. */
function withJsonAccept(request: Request): Request {
  const headers = new Headers(request.headers)
  const accept = headers.get('accept') ?? ''
  headers.set('accept', accept.length === 0 ? 'application/json, text/event-stream' : `application/json, ${accept}`)
  return new Request(request, { headers })
}

function openMcpSession(author: AuthorTools, stateful: boolean): McpSession {
  const server = new McpServer({ name: 'mini-app', version: '0.0.0' }, { capabilities: { tools: {} } })
  server.server.setRequestHandler(ListToolsRequestSchema, () => ({ tools: authorMcpToolList() }))
  server.server.setRequestHandler(CallToolRequestSchema, async (call) => {
    try {
      if (!isAuthorMcpTool(call.params.name)) {
        throw new AuthorError('unknown-tool', `unknown tool: ${call.params.name}. Catalog: ${authorMcpToolList().map(tool => tool.name).join(', ')}`)
      }
      const result = await author.invoke(call.params.name, call.params.arguments ?? {})
      return { content: [{ type: 'text', text: JSON.stringify(result) }] }
    } catch (error) {
      const code = typeof error === 'object' && error !== null && 'code' in error && typeof error.code === 'string'
        ? error.code
        : 'tool-args'
      const message = error instanceof Error ? error.message : 'tool failed'
      return { isError: true, content: [{ type: 'text', text: JSON.stringify({ code, message }) }] }
    }
  })
  const transport = new WebStandardStreamableHTTPServerTransport({
    enableJsonResponse: !stateful,
    ...stateful ? { sessionIdGenerator: () => randomUUID() } : {},
  })
  return { server, transport }
}

function record(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new AuthorError('tool-args', 'tool arguments must be an object')
  }
  return value as Record<string, unknown>
}

function requiredString(args: Record<string, unknown>, key: string): string {
  const value = args[key]
  if (typeof value !== 'string' || value.length === 0) throw new AuthorError('tool-args', `${key} is required`)
  return value
}
