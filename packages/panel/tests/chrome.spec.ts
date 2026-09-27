import { describe, expect, it } from 'vitest'

import { galleryHue } from '../src/chrome/hue.ts'

describe('panel chrome', () => {
  it('keeps a stable hue per app id', () => {
    expect(galleryHue('com.example.todo')).toBe(galleryHue('com.example.todo'))
    expect(galleryHue('com.example.todo')).not.toBe(galleryHue('com.example.notes'))
  })
})
