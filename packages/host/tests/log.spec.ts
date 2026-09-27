import { mkdtempSync, readFileSync, readdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { createHostLog, hostLayout } from '../src/index.ts'

describe('host log file', () => {
  it('appends under the runtime root and drops the oldest segment past the cap', () => {
    const root = mkdtempSync(join(tmpdir(), 'mma-log-'))
    const log = createHostLog(root, 32)
    log.write('com.example.app', 'a'.repeat(20))
    log.write('com.example.app', 'b'.repeat(20))
    const dir = join(root, hostLayout.apps, 'com.example.app', hostLayout.logs)
    expect(dir.startsWith(join(root, hostLayout.apps))).toBe(true)
    const names = readdirSync(dir).filter(name => name.endsWith('.log'))
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) {
      for (const row of readFileSync(join(dir, name), 'utf8').split('\n')) {
        if (row === '') continue
        const value: unknown = JSON.parse(row)
        expect(typeof value === 'object' && value !== null && 'line' in value && typeof value.line === 'string').toBe(true)
      }
    }
    expect(log.read('com.example.app')).toEqual(['b'.repeat(20)])
    expect(log.read('com.example.missing')).toEqual([])
    expect(() => { log.write('../outside', 'no') }).toThrow(/single segment/)
  })
})
