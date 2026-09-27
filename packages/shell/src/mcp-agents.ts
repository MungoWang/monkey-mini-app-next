import { homedir } from 'node:os'
import path from 'node:path'

/** Built-in assistants that can receive the authoring MCP connection. */
export const mcpAgentIds = ['claude', 'pi', 'cursor', 'opencode', 'kiro', 'workbuddy'] as const

export type McpAgentId = (typeof mcpAgentIds)[number]

export type McpAgentFormat = 'mcpServers' | 'claude' | 'opencode'

export interface McpAgentTarget {
  readonly id: McpAgentId
  readonly label: string
  readonly file: string
  readonly detectDir: string
  readonly format: McpAgentFormat
}

/**
 * Paths Shell injects. Host merges a `mini-app` server into each file.
 * WorkBuddy uses CodeBuddy's home. Cursor is here because it speaks MCP; it is not a skill dest.
 */
export function builtinMcpAgents(home = homedir(), env: NodeJS.ProcessEnv = process.env): readonly McpAgentTarget[] {
  const configHome = env.XDG_CONFIG_HOME?.trim() || path.join(home, '.config')
  const claudeConfigDir = env.CLAUDE_CONFIG_DIR?.trim()
  const claudeHome = claudeConfigDir || path.join(home, '.claude')
  const claudeFile = claudeConfigDir === undefined ? path.join(home, '.claude.json') : path.join(claudeConfigDir, '.claude.json')
  return [
    { id: 'claude', label: 'Claude', file: claudeFile, detectDir: claudeHome, format: 'claude' },
    { id: 'pi', label: 'Pi', file: path.join(home, '.pi', 'agent', 'mcp.json'), detectDir: path.join(home, '.pi', 'agent'), format: 'mcpServers' },
    { id: 'cursor', label: 'Cursor', file: path.join(home, '.cursor', 'mcp.json'), detectDir: path.join(home, '.cursor'), format: 'mcpServers' },
    { id: 'opencode', label: 'OpenCode', file: path.join(configHome, 'opencode', 'opencode.jsonc'), detectDir: path.join(configHome, 'opencode'), format: 'opencode' },
    { id: 'kiro', label: 'Kiro', file: path.join(home, '.kiro', 'settings', 'mcp.json'), detectDir: path.join(home, '.kiro'), format: 'mcpServers' },
    { id: 'workbuddy', label: 'WorkBuddy', file: path.join(home, '.codebuddy', 'mcp.json'), detectDir: path.join(home, '.codebuddy'), format: 'mcpServers' },
  ]
}
