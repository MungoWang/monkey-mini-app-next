import { mkdtemp, readFile, stat, utimes, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { cachedUiBundle, purgeAutogen, readAutogen } from '../src/compile/autogen.ts'

describe('autogen', () => {
  it('rewrites the bundle when a source is newer and drops both files together', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-autogen-'))
    await writeFile(join(dir, 'ui.tsx'), 'export const view = 1\n')
    const first = await cachedUiBundle(dir)
    const file = join(dir, '.autogen', 'entry.js')
    const written = await stat(file)
    expect(await readAutogen(dir, 'entry.js')).toBe(first)
    expect((await stat(file)).mtimeMs).toBe(written.mtimeMs)
    const source = join(dir, 'ui.tsx')
    await writeFile(source, 'export const view = 2\n')
    const later = new Date(Date.now() + 5000)
    await utimes(source, later, later)
    const second = await cachedUiBundle(dir)
    expect(second).not.toBe(first)
    await purgeAutogen(dir)
    await expect(readFile(file, 'utf8')).rejects.toThrow()
  })
})
