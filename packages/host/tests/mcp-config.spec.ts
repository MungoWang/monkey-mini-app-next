import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { hostMcpPath, loadMcpServers, mcpConfigEnv } from '../src/index.ts'

describe('loadMcpServers', () => {
  it('treats a missing default file as zero servers and a bad file as boot failure', async () => {
    const root = await mkdtemp(join(tmpdir(), 'mma-mcp-'))
    expect(await loadMcpServers(root, {})).toEqual({})
    await writeFile(hostMcpPath(root), '{')
    await expect(loadMcpServers(root, {})).rejects.toMatchObject({ code: 'config-invalid' })
    await writeFile(hostMcpPath(root), JSON.stringify({
      settings: { nope: true },
      echo: { command: 'echo', args: ['hi'] },
    }))
    expect(await loadMcpServers(root, {})).toEqual({ echo: { command: 'echo', args: ['hi'] } })
    const other = join(root, 'elsewhere.json')
    await writeFile(other, JSON.stringify({ remote: { url: 'https://example.com/mcp' } }))
    expect(await loadMcpServers(root, { [mcpConfigEnv]: other })).toEqual({
      remote: { url: 'https://example.com/mcp' },
    })
    await expect(loadMcpServers(root, { [mcpConfigEnv]: join(root, 'missing.json') })).rejects.toMatchObject({ code: 'config-invalid' })
    await writeFile(hostMcpPath(root), JSON.stringify({
      live: { command: 'echo' },
      off: { command: 'echo', disabled: true },
    }))
    expect(await loadMcpServers(root, {})).toEqual({ live: { command: 'echo' } })
  })
})
