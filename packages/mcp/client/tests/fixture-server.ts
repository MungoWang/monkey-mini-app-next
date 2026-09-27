// Fixture needs the low-level Server so tool arguments stay visible without a schema.
// oxlint-disable typescript/no-deprecated
import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js'

const names = ['echo', 'fail', 'pid', 'exit', 'die', 'struct', 'image', 'blank']
let listed = false
const server = new Server({ name: 'fixture', version: '0.0.0' }, { capabilities: { tools: {} } })
server.setRequestHandler(ListToolsRequestSchema, () => {
  if (!listed) {
    listed = true
    return {
      tools: names.slice(0, 4).map(name => ({ name, inputSchema: { type: 'object' } })),
      nextCursor: 'more',
    }
  }
  return { tools: names.slice(4).map(name => ({ name, inputSchema: { type: 'object' } })) }
})
server.setRequestHandler(CallToolRequestSchema, (request) => {
  if (request.params.name === 'fail') {
    const leaked = process.env.LEAK ?? ''
    const text = leaked.length === 0 ? 'tool said no' : `tool said no ${leaked} ${process.env.SHORT ?? ''}`
    return { isError: true, content: [{ type: 'text', text }] }
  }
  if (request.params.name === 'blank') {
    return { isError: true, content: [] }
  }
  if (request.params.name === 'struct') {
    return { structuredContent: { ok: true }, content: [{ type: 'text', text: 'ignored' }] }
  }
  if (request.params.name === 'image') {
    return { content: [{ type: 'image', data: 'aa', mimeType: 'image/png' }] }
  }
  if (request.params.name === 'pid') {
    return { content: [{ type: 'text', text: String(process.pid) }] }
  }
  if (request.params.name === 'exit') {
    setTimeout(() => process.exit(0), 20)
    return { content: [{ type: 'text', text: 'bye' }] }
  }
  if (request.params.name === 'die') process.exit(0)
  const args = request.params.arguments as { input?: string } | undefined
  return { content: [{ type: 'text', text: args?.input ?? '' }] }
})
await server.connect(new StdioServerTransport())
