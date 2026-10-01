import { describe, expect, it } from 'vitest'
import { assertNever, packageId } from '../src/index.ts'

type Gate = 'open' | 'closed'

function label(gate: Gate): string {
  switch (gate) {
    case 'open':
      return 'open'
    case 'closed':
      return 'closed'
    default:
      return assertNever(gate)
  }
}

describe('packageId', () => {
  it('names the package', () => {
    expect(packageId).toBe('@mohou/values')
  })
})

describe('assertNever', () => {
  it('throws when a closed union reaches the impossible branch', () => {
    const value = 'other' as never

    expect(() => assertNever(value)).toThrow('unreachable variant: "other"')
    expect(() => assertNever(value, 'gate')).toThrow('unreachable variant in gate: "other"')
  })

  it('returns the matching arm for a handled variant', () => {
    expect(label('open')).toBe('open')
  })
})
