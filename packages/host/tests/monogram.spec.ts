import { describe, expect, it } from 'vitest'

import { monogram } from '../src/index.ts'

describe('monogram', () => {
  it('prefers the author acronym and otherwise takes two characters from the name', () => {
    expect(monogram('Example', 'Ex')).toBe('EX')
    expect(monogram('Example', '笔记')).toBe('笔记')
    expect(monogram('Todo')).toBe('TO')
    expect(monogram('A')).toBe('A')
    expect(monogram('已办事项')).toBe('已办')
  })
})
