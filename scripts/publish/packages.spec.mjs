import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { publishFailures, workspacePackages } from './packages.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

describe('publish packages', () => {
  it('accepts the workspace set and keeps the root private', { timeout: 15_000 }, () => {
    expect(publishFailures(root)).toEqual([])
    expect(workspacePackages(root).map(item => item.pkg.name)).toEqual([
      '@mini-app/app-view',
      '@mini-app/contract',
      '@mini-app/host',
      '@mini-app/mcp-client',
      '@mini-app/panel',
      '@mini-app/runtime-pi',
      '@mini-app/runtime-provider',
      '@mini-app/shell',
      '@mini-app/ui',
      '@mini-app/values',
    ])
  })
})
