import { describe, expect, it, vi } from 'vitest'

const gate = vi.hoisted(() => ({ failure: 'down' as unknown }))

vi.mock('@mohou/mcp-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@mohou/mcp-client')>()
  class FakeClient {
    async listTools(): Promise<never> {
      throw gate.failure
    }

    async dispose(): Promise<void> {}
  }
  return { ...actual, McpClient: FakeClient }
})

describe('mcp editor check failure shape', () => {
  it('names a non-error failure and an empty error the same way', async () => {
    const { checkMcpEditor } = await import('../src/host/mcp-editor.ts')
    gate.failure = 'down'
    expect(await checkMcpEditor({ id: 'echo', command: 'echo' }, {})).toMatchObject({
      ok: false,
      code: 'mcp-start-failed',
      message: 'mcp server did not start',
    })
    gate.failure = new Error('')
    expect(await checkMcpEditor({ id: 'echo', command: 'echo' }, {})).toMatchObject({
      ok: false,
      code: 'mcp-start-failed',
      message: 'mcp server did not start',
    })
    gate.failure = new Error('closed')
    expect(await checkMcpEditor({ id: 'echo', command: 'echo' }, {})).toMatchObject({
      ok: false,
      message: 'closed',
    })
  })
})
