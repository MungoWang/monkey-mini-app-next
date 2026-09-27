import { describe, expect, it } from 'vitest'

import { classifyImport } from '../src/imports.ts'

describe('classifyImport', () => {
  it('allows a nested file to import shared and rejects a path that leaves the app', () => {
    expect(classifyImport('../shared/model.ts', 'backend', 'api/store.ts')).toBeUndefined()
    expect(classifyImport('../secret.ts', 'ui', 'ui.tsx')).toBe('import-escape')
    expect(classifyImport('./ui/card.tsx', 'backend', 'main.api.ts')).toBe('import-forbidden')
    expect(classifyImport('./assets/mark.svg', 'ui', 'ui.tsx')).toBe('import-forbidden')
    expect(classifyImport('../assets/mark.svg', 'backend', 'api/store.ts')).toBe('import-forbidden')
  })
})
