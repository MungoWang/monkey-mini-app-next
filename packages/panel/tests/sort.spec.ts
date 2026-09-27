import { describe, expect, it } from 'vitest'

import type { GalleryApp } from '../src/gallery/list.ts'
import { appSortings, sortApps } from '../src/gallery/sort.ts'

const apps: readonly GalleryApp[] = [
  { id: 'com.example.early', name: 'Early', description: 'a', version: '1', acronym: 'EA', createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-02-01T00:00:00.000Z' },
  { id: 'com.example.late', name: 'Late', description: 'b', version: '1', acronym: 'LA', createdAt: '2026-03-01T00:00:00.000Z' },
  { id: 'com.example.none', name: 'None', description: 'c', version: '1', acronym: 'NO' },
]

const heat = {
  'com.example.early': { lastOpenedAt: '2026-04-01T00:00:00.000Z', openCount: 2 },
  'com.example.late': { lastOpenedAt: '2026-05-01T00:00:00.000Z', openCount: 2 },
}

describe('sortApps', () => {
  it('sorts heat by open count, then last open, and keeps a missing time last', () => {
    expect(sortApps(apps, appSortings.heat, 'desc', heat).map(app => app.id)).toEqual([
      'com.example.late',
      'com.example.early',
      'com.example.none',
    ])
    expect(sortApps(apps, appSortings.heat, 'asc', heat).map(app => app.id)).toEqual([
      'com.example.none',
      'com.example.early',
      'com.example.late',
    ])
  })

  it('sorts created time and leaves the input array unchanged', () => {
    const sorted = sortApps(apps, appSortings.createdTime, 'asc', {})
    expect(sorted.map(app => app.id)).toEqual(['com.example.early', 'com.example.late', 'com.example.none'])
    expect(apps.map(app => app.id)).toEqual(['com.example.early', 'com.example.late', 'com.example.none'])
    expect(sortApps(apps, appSortings.updatedTime, 'desc', {}).map(app => app.id)).toEqual([
      'com.example.early',
      'com.example.late',
      'com.example.none',
    ])
  })
})
