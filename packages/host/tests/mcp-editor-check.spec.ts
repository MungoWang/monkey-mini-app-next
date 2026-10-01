import { describe, expect, it, vi } from 'vitest'

vi.mock('@mohou/mcp-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mohou/mcp-client')>()
  class FakeClient {
    async listTools(): Promise<readonly { name: string; description?: string }[]> {
      return [{ name: 'ping', description: 'pong' }, { name: 'bare' }]
    }

    async dispose(): Promise<void> {}
  }
  return { ...actual, McpClient: FakeClient }
})

describe('mcp editor check success', () => {
  it('lists tools from a server that starts', async () => {
    const { checkMcpEditor } = await import('../src/host/mcp-editor.ts')
    const result = await checkMcpEditor({ id: 'echo', command: 'echo' }, {})
    expect(result).toEqual({
      ok: true,
      tools: [{ name: 'ping', description: 'pong' }, { name: 'bare' }],
    })
  })
})
