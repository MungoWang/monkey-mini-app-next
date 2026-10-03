import { mkdir, mkdtemp, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { bundleUi } from '../src/compile/bundle-ui.ts'

describe('bundleUi', () => {
  it('keeps the component name and leaves react external', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-'))
    await writeFile(join(dir, 'local.ts'), 'export const ready = true\n')
    await writeFile(join(dir, 'ui.tsx'), "import { useState } from 'react'\nimport { ready } from './local.ts'\nexport function Card() { return useState(ready) }\n")
    const bundle = await bundleUi(dir)
    expect(bundle.code).toContain('function Card')
    expect(bundle.code).toContain('from "react"')
    expect(bundle.code).not.toContain('function useState')
  })

  it('bundles a lodash subpath into the app', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-lodash-'))
    await writeFile(join(dir, 'ui.tsx'), "import get from 'lodash/get'\nexport const value = get({ a: 1 }, 'a')\n")
    const bundle = await bundleUi(dir)
    expect(bundle.code).not.toContain('from "lodash/get"')
    await writeFile(join(dir, 'ui.tsx'), "import lodash from 'lodash'\nexport const value = lodash\n")
    const root = await bundleUi(dir)
    expect(root.code).toContain('from "lodash"')
  })

  it('resolves extensionless relative imports to .tsx', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-ext-'))
    await mkdir(join(dir, 'ui'), { recursive: true })
    await writeFile(join(dir, 'ui', 'item-row.tsx'), 'export function ItemRow() { return null }\n')
    await writeFile(join(dir, 'ui.tsx'), "import { ItemRow } from './ui/item-row'\nexport default function App() { return ItemRow }\n")
    const bundle = await bundleUi(dir)
    expect(bundle.code).toContain('function ItemRow')
  })

  it('rejects a missing entry, a bare import, and a missing relative file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-bad-'))
    await expect(bundleUi(dir, 'silent')).rejects.toMatchObject({ code: 'ui-invalid' })
    await writeFile(join(dir, 'ui.tsx'), "import 'left-pad'\nexport const n = 1\n")
    await expect(bundleUi(dir, 'silent')).rejects.toMatchObject({ code: 'import-forbidden' })
    await writeFile(join(dir, 'ui.tsx'), "import { n } from './missing'\nexport const value = n\n")
    await expect(bundleUi(dir, 'silent')).rejects.toMatchObject({ code: 'ui-invalid' })
  })

  it('reports the esbuild text for a name the module does not export', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-export-'))
    await writeFile(join(dir, 'shared.ts'), 'export const other = 1\n')
    await writeFile(join(dir, 'ui.tsx'), "import { MCP_PRESETS } from './shared.ts'\nexport const value = MCP_PRESETS\n")
    const failure = await bundleUi(dir, 'silent').catch((error: unknown) => error)
    expect(failure).toMatchObject({ code: 'ui-invalid' })
    const message = failure instanceof Error ? failure.message : ''
    expect(message).toContain('ui.tsx:1:9')
    expect(message).toContain('No matching export in "shared.ts" for import "MCP_PRESETS"')
  })

  it('rejects an import of an assets file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-asset-'))
    await writeFile(join(dir, 'ui.tsx'), "import mark from './assets/mark.svg'\nexport const src = mark\n")
    await expect(bundleUi(dir, 'silent')).rejects.toMatchObject({ code: 'import-forbidden' })
  })

  it('rejects a relative import whose real path leaves the app', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-ui-escape-'))
    const outside = await mkdtemp(join(tmpdir(), 'mma-ui-out-'))
    await writeFile(join(outside, 'secret.ts'), 'export const n = 1\n')
    await symlink(join(outside, 'secret.ts'), join(dir, 'secret.ts'))
    await writeFile(join(dir, 'ui.tsx'), "import { n } from './secret.ts'\nexport const value = n\n")
    await expect(bundleUi(dir, 'silent')).rejects.toMatchObject({ code: 'import-escape' })
  })
})
