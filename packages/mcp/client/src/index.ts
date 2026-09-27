/** External MCP client. Not a model provider. @module @mini-app/mcp-client */

export const packageId = '@mini-app/mcp-client' as const

export { McpError, mcpCodes, type McpCode } from './codes.ts'
export { resolveMcpConfig, type McpServerSpec } from './config.ts'
export { McpClient } from './client.ts'
