import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { openStorage } from '../src/index.ts'

describe('storage size notice', () => {
  it('names the table and heavy keys after the write commits', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'mma-notice-'))
    const seen: Array<{ table: string; keys: string[] }> = []
    const storage = await openStorage(dir, {
      noticeBytes: 1,
      onNotice: (notice) => {
        seen.push(notice)
      },
    })
    await storage.connect().kv().set('small', 'a')
    await storage.connect().kv().set('heavy', 'a'.repeat(20))
    expect(seen.at(-1)).toEqual({ table: 'kv', keys: ['heavy', 'small'] })
    const before = seen.length
    await storage.connect().kv().set('heavy', 'a'.repeat(20))
    expect(seen.length).toBe(before)
    storage.close()
  })
})
