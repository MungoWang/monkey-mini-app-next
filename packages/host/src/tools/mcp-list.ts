import { McpClient, McpError } from '@mohou/mcp-client'

import { AuthorError } from './codes.ts'

export interface AuthorMcpTool {
  name: string
  description?: string
  inputSchema: Record<string, unknown>
}

export interface AuthorMcpServerNames {
  id: string
  tools?: readonly string[]
  error?: { code: 'mcp-not-connected' | 'mcp-start-failed' }
}

export interface AuthorMcpServerTools {
  id: string
  tools?: AuthorMcpTool[]
  error?: { code: 'mcp-not-connected' | 'mcp-start-failed' }
}

/**
 * Authoring index of external MCP servers. Names only. No descriptions, no schemas, no env.
 * One server failure does not drop the others.
 * @param client - host-held MCP client
 */
export async function listMcpForAuthor(client: McpClient): Promise<{ servers: AuthorMcpServerNames[] }> {
  const servers: AuthorMcpServerNames[] = []
  for (const id of client.serverIds()) {
    try {
      const tools = await client.listTools(id)
      servers.push({ id, tools: tools.map(tool => tool.name) })
    } catch (error) {
      servers.push({ id, error: { code: listFailure(error) } })
    }
  }
  return { servers }
}

/**
 * Tool detail for one connected MCP server. Optional `toolName` returns that one tool only.
 * @param client - host-held MCP client
 * @param serverId - key in the resolved config
 * @param toolName - when set, only that tool; unknown name is `tool-args`
 */
export async function toolsMcpForAuthor(
  client: McpClient,
  serverId: string,
  toolName?: string,
): Promise<AuthorMcpServerTools> {
  try {
    const listed = await client.listTools(serverId)
    const tools = listed.map(tool => ({
      name: tool.name,
      ...tool.description === undefined ? {} : { description: tool.description },
      inputSchema: tool.inputSchema,
    }))
    if (toolName === undefined) return { id: serverId, tools }
    const match = tools.find(tool => tool.name === toolName)
    if (match === undefined) {
      throw new AuthorError('tool-args', `unknown tool: ${toolName} on ${serverId}`)
    }
    return { id: serverId, tools: [match] }
  } catch (error) {
    if (error instanceof AuthorError) throw error
    return { id: serverId, error: { code: listFailure(error) } }
  }
}

function listFailure(error: unknown): 'mcp-not-connected' | 'mcp-start-failed' {
  return error instanceof McpError && (error.code === 'mcp-not-connected' || error.code === 'mcp-start-failed')
    ? error.code
    : 'mcp-start-failed'
}
