import { describe, expect, it } from 'vitest'

import { filterGallery, galleryKind, isGalleryCardStyle, type GalleryApp } from '../src/index.ts'

const apps: GalleryApp[] = [
  { id: 'com.example.todo', name: 'Todo', description: 'A list', version: '1', acronym: 'TO' },
  { id: 'com.example.notes', name: 'Notes', description: 'A pad', version: '2', acronym: 'NO' },
]

describe('gallery', () => {
  it('filters visible fields and does not treat unreachable as empty', () => {
    expect(filterGallery(apps, ' pad ').map(app => app.id)).toEqual(['com.example.notes'])
    expect(filterGallery(apps, 'TO').map(app => app.name)).toEqual(['Todo'])
    expect(filterGallery(apps, '').length).toBe(2)
    expect(galleryKind({ reachable: false, apps: [] })).toBe('unreachable')
    expect(galleryKind({ reachable: true, failed: '500', apps: [] })).toBe('failed')
    expect(galleryKind({ reachable: true, apps: [] })).toBe('empty')
    expect(galleryKind({ reachable: true, apps: [], query: 'missing' })).toBe('none')
    expect(galleryKind({ reachable: true, apps: [], query: '  ' })).toBe('empty')
    expect(galleryKind({ reachable: true, apps })).toBe('ready')
    expect(isGalleryCardStyle('etch')).toBe(true)
    expect(isGalleryCardStyle('grid')).toBe(false)
  })
})
