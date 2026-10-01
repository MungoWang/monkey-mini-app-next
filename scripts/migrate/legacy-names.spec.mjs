import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { applyMigration, hasWork, planMigration, rewriteSpecifiers } from './legacy-names.mjs'

function fixture() {
  const base = mkdtempSync(join(tmpdir(), 'mohou-migrate-'))
  const root = join(base, 'runtime')
  const packsDir = join(base, 'packages')
  const app = join(root, 'apps', 'com.example.one')
  mkdirSync(join(app, 'ui'), { recursive: true })
  mkdirSync(join(app, 'storage'), { recursive: true })
  mkdirSync(join(app, '.autogen'), { recursive: true })
  mkdirSync(packsDir, { recursive: true })
  writeFileSync(join(app, 'ui.tsx'), "import { Badge, Button } from '@mini-app/ui'\nimport type { AppContext } from '@mini-app/contract'\n")
  writeFileSync(join(app, 'ui', 'row.tsx'), "import { Badge } from '@mini-app/ui'\n")
  writeFileSync(join(app, 'main.api.ts'), "import { defineApp } from '@monkey-mini-app/contract'\n")
  writeFileSync(join(app, 'legacy.sdk.ts'), "import { makeSdk } from '@monkey-mini-app/sdk'\n")
  writeFileSync(join(app, 'storage', 'data.json'), '{"note":"imported from @mini-app/ui once"}\n')
  writeFileSync(join(app, '.autogen', 'entry.js'), "import { Button } from '@mini-app/ui'\n")
  writeFileSync(join(packsDir, 'mini-app-shell-1.0.0.tgz'), 'stale\n')
  writeFileSync(join(packsDir, 'mohou-shell-1.0.0.tgz'), 'current\n')
  const backup = join(base, 'backup')
  return { base, root, packsDir, app, backup }
}

describe('rewriteSpecifiers', () => {
  it('maps both retired scopes and reports one the table cannot express', () => {
    const { text, hits, unmapped } = rewriteSpecifiers("import { Badge } from '@mini-app/ui'\nconst sdk = '@monkey-mini-app/sdk'\n")
    expect(text).toContain("'@mohou/ui'")
    expect(hits).toEqual([{ from: '@mini-app/', to: '@mohou/', count: 1 }])
    expect(unmapped).toEqual(['@monkey-mini-app/sdk'])
  })

  it('leaves text without a retired name alone', () => {
    expect(rewriteSpecifiers("import { Button } from '@mohou/ui'\n")).toEqual({ text: "import { Button } from '@mohou/ui'\n", hits: [], unmapped: [] })
  })
})

describe('the build cache', () => {
  it('plans to clear .autogen for an app whose source it rewrites', () => {
    const { root, packsDir } = fixture()
    const plan = planMigration({ root, packsDir })
    expect(plan.caches).toEqual([{ appId: 'com.example.one', reason: 'rewritten source' }])
  })

  it('clears a bundle that names a retired scope even when no source changed', () => {
    const { root, packsDir, app, backup } = fixture()
    writeFileSync(join(app, 'ui.tsx'), "import { Button } from '@mohou/ui'\n")
    writeFileSync(join(app, 'main.api.ts'), "import { defineApp } from '@mohou/contract'\n")
    writeFileSync(join(app, 'ui', 'row.tsx'), "import { Badge } from '@mohou/ui'\n")
    writeFileSync(join(app, 'legacy.sdk.ts'), "import { makeSdk } from '@mohou/sdk'\n")
    const plan = planMigration({ root, packsDir })
    expect(plan.edits).toEqual([])
    expect(plan.caches).toEqual([{ appId: 'com.example.one', reason: 'bundle names a retired scope' }])

    const result = applyMigration(plan, backup)
    expect(result.clearedCaches).toEqual(['com.example.one'])
    expect(existsSync(join(app, '.autogen'))).toBe(false)
    expect(readFileSync(join(backup, 'apps', 'com.example.one', '.autogen', 'entry.js'), 'utf8')).toContain('@mini-app/ui')
  })

  it('leaves a cache that names nothing retired', () => {
    const { root, packsDir, app } = fixture()
    writeFileSync(join(app, 'ui.tsx'), "import { Button } from '@mohou/ui'\n")
    writeFileSync(join(app, 'main.api.ts'), "import { defineApp } from '@mohou/contract'\n")
    writeFileSync(join(app, 'ui', 'row.tsx'), "import { Badge } from '@mohou/ui'\n")
    writeFileSync(join(app, '.autogen', 'entry.js'), "import { Button } from '@mohou/ui'\n")
    expect(planMigration({ root, packsDir }).caches).toEqual([])
  })
})

describe('planMigration', () => {
  it('plans app source, skips app data and build output, and finds stale packs', () => {
    const { root, packsDir } = fixture()
    const plan = planMigration({ root, packsDir })
    expect(plan.appIds).toEqual(['com.example.one'])
    expect(plan.edits.map(edit => edit.rel).sort()).toEqual(['main.api.ts', 'ui.tsx', 'ui/row.tsx'])
    expect(plan.packs).toEqual(['mini-app-shell-1.0.0.tgz'])
    expect(plan.unmapped).toEqual([{ appId: 'com.example.one', rel: 'legacy.sdk.ts', name: '@monkey-mini-app/sdk' }])
  })

  it('reads only: a plan leaves every file as it was', () => {
    const { root, packsDir, app } = fixture()
    const before = readFileSync(join(app, 'ui.tsx'), 'utf8')
    planMigration({ root, packsDir })
    expect(readFileSync(join(app, 'ui.tsx'), 'utf8')).toBe(before)
    expect(readFileSync(join(app, 'storage', 'data.json'), 'utf8')).toContain('@mini-app/ui')
  })
})

describe('applyMigration', () => {
  it('rewrites app source, backs it up, and leaves app data alone', () => {
    const { root, packsDir, app, backup } = fixture()
    const plan = planMigration({ root, packsDir })
    const result = applyMigration(plan, backup)

    expect(readFileSync(join(app, 'ui.tsx'), 'utf8')).toBe("import { Badge, Button } from '@mohou/ui'\nimport type { AppContext } from '@mohou/contract'\n")
    expect(readFileSync(join(app, 'main.api.ts'), 'utf8')).toBe("import { defineApp } from '@mohou/contract'\n")
    expect(readFileSync(join(app, 'legacy.sdk.ts'), 'utf8')).toContain('@monkey-mini-app/sdk')
    expect(readFileSync(join(app, 'storage', 'data.json'), 'utf8')).toContain('@mini-app/ui')

    expect(existsSync(join(app, '.autogen'))).toBe(false)
    expect(readFileSync(join(backup, 'apps', 'com.example.one', '.autogen', 'entry.js'), 'utf8')).toContain('@mini-app/ui')
    expect(readFileSync(join(backup, 'apps', 'com.example.one', 'ui.tsx'), 'utf8')).toContain('@mini-app/ui')
    expect(result.written).toContain('apps/com.example.one/ui.tsx')
    expect(result.clearedCaches).toEqual(['com.example.one'])
    expect(result.movedPacks).toEqual(['mini-app-shell-1.0.0.tgz'])
    expect(readFileSync(join(backup, 'packs', 'mini-app-shell-1.0.0.tgz'), 'utf8')).toBe('stale\n')
    expect(readFileSync(join(packsDir, 'mohou-shell-1.0.0.tgz'), 'utf8')).toBe('current\n')
  })

  it('is idempotent: a second plan has nothing left to do', () => {
    const { root, packsDir, backup } = fixture()
    applyMigration(planMigration({ root, packsDir }), backup)
    const again = planMigration({ root, packsDir })
    expect(again.edits).toEqual([])
    expect(again.caches).toEqual([])
    expect(again.packs).toEqual([])
  })

  it('handles a runtime root with no apps directory', () => {
    const base = mkdtempSync(join(tmpdir(), 'mohou-migrate-empty-'))
    const plan = planMigration({ root: base, packsDir: join(base, 'packages') })
    expect(plan).toMatchObject({ appIds: [], edits: [], packs: [] })
    expect(hasWork(plan)).toBe(false)
  })
})
