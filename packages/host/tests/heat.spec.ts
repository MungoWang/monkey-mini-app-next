import { describe, expect, it } from 'vitest'

import { heat } from '../src/host/heat.ts'

describe('heat', () => {
  it('keeps the latest open and the count, and omits an app with no sample', () => {
    expect(heat([])).toEqual({})
    expect(heat([
      { appId: 'com.example.app', openedAt: '2026-09-20T01:00:00.000Z' },
      { appId: 'com.example.other', openedAt: '2026-09-20T03:00:00.000Z' },
      { appId: 'com.example.app', openedAt: '2026-09-20T02:00:00.000Z' },
      { appId: 'com.example.app', openedAt: '2026-09-19T23:00:00.000Z' },
    ])).toEqual({
      'com.example.app': { lastOpenedAt: '2026-09-20T02:00:00.000Z', openCount: 3 },
      'com.example.other': { lastOpenedAt: '2026-09-20T03:00:00.000Z', openCount: 1 },
    })
  })
})
