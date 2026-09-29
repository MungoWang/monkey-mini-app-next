import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, it } from 'vitest'

import { buildPanelPage } from '../src/panel-page.ts'

describe('buildPanelPage', () => {
  it('builds a document that loads the panel script', async () => {
    const page = await buildPanelPage()
    const markers = readFileSync(fileURLToPath(new URL('./expected/panel-document.txt', import.meta.url)), 'utf8')
    for (const line of markers.split('\n')) {
      if (line !== '') expect(page.html).toContain(line)
    }
    expect(page.html).toContain('.bg-background')
    expect(page.html).toContain('#mma-host{height:100%;min-height:0;overflow:hidden')
    expect(page.script.length).toBeGreaterThan(1000)
  }, 60_000)

  it('imports under Node type stripping', () => {
    const root = fileURLToPath(new URL('../../..', import.meta.url))
    const result = spawnSync(process.execPath, ['--experimental-strip-types', '--input-type=module', '-e', "import { buildPanelPage } from './packages/shell/src/panel-page.ts'; const page = await buildPanelPage(); if (!page.html.includes('#mma-host')) throw new Error('missing css')"], {
      cwd: root,
      encoding: 'utf8',
    })
    expect(result.status, result.stderr).toBe(0)
  })
})
