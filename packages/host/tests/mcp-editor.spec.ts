import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { hostMcpPath } from '../src/host/layout.ts'
import { mcpConfigEnv } from '../src/host/mcp.ts'
import { checkMcpEditor, editorServers, readMcpEditor, readMcpImport, writeMcpEditor } from '../src/host/mcp-editor.ts'

describe('mcp editor', () => {
  it('writes a valid file and refuses an empty id', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-edit-'))
    expect(await readMcpEditor(root, {})).toEqual([])
    await writeMcpEditor(root, [{ id: 'echo', command: 'echo', args: ['hi'] }], {})
    expect(await readMcpEditor(root, {})).toEqual([{ id: 'echo', command: 'echo', args: ['hi'] }])
    const text = await readFile(hostMcpPath(root), 'utf8')
    expect(text.endsWith('\n')).toBe(true)
    await expect(writeMcpEditor(root, [{ id: ' ' }], {})).rejects.toMatchObject({ code: 'config-invalid' })
    expect(await readMcpEditor(root, {})).toEqual([{ id: 'echo', command: 'echo', args: ['hi'] }])
    await writeFile(hostMcpPath(root), '{}\n', 'utf8')
    expect(await readMcpEditor(root, {})).toEqual([])
    await writeMcpEditor(root, [{ id: 'off', command: 'echo', enabled: false }], {})
    expect(JSON.parse(await readFile(hostMcpPath(root), 'utf8'))).toMatchObject({ off: { disabled: true } })
    await expect(readMcpImport(join(root, 'missing.json'))).rejects.toMatchObject({ code: 'config-invalid' })
    await writeFile(hostMcpPath(root), '   \n', 'utf8')
    expect(await readMcpEditor(root, {})).toEqual([])
    await writeFile(hostMcpPath(root), '{', 'utf8')
    await expect(readMcpEditor(root, {})).rejects.toMatchObject({ code: 'config-invalid', message: 'mcp import is not JSON' })
    await writeFile(hostMcpPath(root), '{ "settings": { "theme": "dark" } }\n', 'utf8')
    expect(await readMcpEditor(root, {})).toEqual([])
  })

  it('keeps a description, omits a blank one, and follows an explicit config path', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-desc-'))
    await writeMcpEditor(root, [
      { id: 'echo', command: 'echo', description: '  hello  ', enabled: true },
      { id: 'quiet', command: 'echo', description: '   ' },
    ], {})
    const body = JSON.parse(await readFile(hostMcpPath(root), 'utf8')) as Record<string, { description?: string; disabled?: boolean }>
    expect(body.echo?.description).toBe('hello')
    expect(body.echo?.disabled).toBeUndefined()
    expect(body.quiet?.description).toBeUndefined()
    const override = join(root, 'picked.json')
    const env = { [mcpConfigEnv]: override }
    await writeMcpEditor(root, [{ id: 'picked', url: 'https://example.com/mcp' }], env)
    expect(await readMcpEditor(root, env)).toEqual([
      { id: 'picked', url: 'https://example.com/mcp', transport: 'streamable-http' },
    ])
    expect(JSON.parse(await readFile(hostMcpPath(root), 'utf8'))).not.toHaveProperty('picked')
    await writeFile(join(root, 'import.json'), '{ "mcpServers": { "pi": { "command": "pi" } } }\n', 'utf8')
    expect(await readMcpImport(join(root, 'import.json'))).toEqual([{ id: 'pi', command: 'pi' }])
    expect(editorServers({
      local: { command: 'echo' },
      remote: { url: 'https://example.com/mcp' },
    })).toEqual([
      { id: 'local', command: 'echo' },
      { id: 'remote', url: 'https://example.com/mcp' },
    ])
  })

  it('reports a server that cannot start and closes it', async () => {
    const result = await checkMcpEditor({ id: 'missing', command: 'mini-app-no-such-mcp-bin' }, {})
    expect(result.ok).toBe(false)
    expect(result.tools).toEqual([])
    expect(result.code).toBe('mcp-start-failed')
    expect(editorServers({
      local: { command: 'echo', args: ['hi'], env: { A: 'b' } },
      remote: { url: 'https://example.com/mcp', transport: 'sse', headers: { K: 'v' } },
    })).toEqual([
      { id: 'local', command: 'echo', args: ['hi'], env: { A: 'b' } },
      { id: 'remote', url: 'https://example.com/mcp', transport: 'sse', headers: { K: 'v' } },
    ])
  })
})
