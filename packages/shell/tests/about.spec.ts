import { describe, expect, it } from 'vitest'

import { aboutVersions } from '../src/about.ts'

describe('aboutVersions', () => {
  it('reads package versions and does not invent one', () => {
    const text = aboutVersions()
    expect(text).toContain('@mini-app/host ')
    expect(text).toContain('@mini-app/shell ')
    expect(text).not.toContain('unknown')
  })
})
