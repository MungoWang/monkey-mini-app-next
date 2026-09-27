import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { purgeAutogen } from '../src/compile/autogen.ts'
import { compileAppStylesheet } from '../src/compile/sheet.ts'

describe('compileAppStylesheet', () => {
  it('lets Tailwind emit utilities and appends the author file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-tw-'))
    await writeFile(join(dir, 'ui.tsx'), 'export const view = <div className="flex bg-background p-4" />\n')
    await writeFile(join(dir, 'ui.css'), '.panel { padding: 16px }\n')
    const css = await compileAppStylesheet(dir)
    expect(css).toContain('.flex')
    expect(css).toContain('.bg-background')
    expect(css).toContain('.bg-primary')
    expect(css).toContain('.panel')
    expect(await compileAppStylesheet(dir)).toBe(css)
    await purgeAutogen(dir)
    expect(await compileAppStylesheet(dir)).toContain('.flex')
    await expect(compileAppStylesheet(join(dir, 'missing'))).rejects.toMatchObject({ code: 'ui-invalid' })
  })
})
