import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { admitMcpText } from '../src/host/mcp-import.ts'
import { readMcpImport } from '../src/host/mcp-editor.ts'

describe('admitMcpText', () => {
  it('wraps a fragment and reads a map, one server, and other field names', () => {
    expect(admitMcpText('"echo": { "cmd": "echo", "arguments": "-n hi" }')).toEqual([
      { id: 'echo', command: 'echo', args: ['-n', 'hi'] },
    ])
    expect(admitMcpText(JSON.stringify({
      mcpServers: {
        settings: { nope: true },
        remote: { serverUrl: 'https://example.com/mcp', type: 'sse', _monkeyagent: { description: 'Calendar' } },
      },
    }))).toEqual([
      { id: 'remote', url: 'https://example.com/mcp', transport: 'sse', description: 'Calendar' },
    ])
    expect(admitMcpText('{ "command": "npx", "name": "files" }')).toEqual([{ id: 'files', command: 'npx' }])
  })

  it('reads a file Shell pointed at', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-import-'))
    const file = join(root, 'mcp.json')
    await writeFile(file, '{ "one": { "command": "echo" } }')
    expect(await readMcpImport(file)).toEqual([{ id: 'one', command: 'echo' }])
    await expect(readMcpImport(join(root, 'missing.json'))).rejects.toMatchObject({ code: 'config-invalid' })
  })

  it('maps array rows, disabled flags, and http aliases', () => {
    expect(() => admitMcpText('not-json')).toThrow('not JSON')
    expect(() => admitMcpText('{"settings":{}}')).toThrow('no servers')
    expect(admitMcpText(JSON.stringify([
      { name: 'off', command: 'echo', disabled: true, env: { K: 'v' } },
      { command: 'npx', type: 'stdio' },
      { url: 'https://example.com/mcp', type: 'http', headers: { A: 'b' } },
      { nope: true },
    ]))).toEqual([
      { id: 'off', command: 'echo', env: { K: 'v' }, enabled: false },
      { id: 'server-2', command: 'npx' },
      { id: 'server-3', url: 'https://example.com/mcp', transport: 'streamable-http', headers: { A: 'b' } },
    ])
    expect(admitMcpText('```json\n{"x":{"cmd":"echo","args":""}}\n```')).toEqual([{ id: 'x', command: 'echo' }])
  })
})
