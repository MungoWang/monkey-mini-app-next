/** @vitest-environment jsdom */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { defaultCardStyle, readCardStyle, writeCardStyle } from '../src/gallery/card-style.ts'

beforeEach(() => {
  installMemoryStorage()
})

afterEach(() => {
  localStorage.clear()
})

describe('card style memory', () => {
  it('keeps a known style and ignores an unknown one', () => {
    expect(readCardStyle()).toBe(defaultCardStyle)
    writeCardStyle('list')
    expect(readCardStyle()).toBe('list')
    localStorage.setItem('mini-app.panel.card-style', 'nope')
    expect(readCardStyle()).toBe(defaultCardStyle)
  })

  it('stays on glass when storage throws', () => {
    const storage = {
      getItem(): string {
        throw new Error('denied')
      },
      setItem(): void {
        throw new Error('denied')
      },
      clear(): void {
        return undefined
      },
      removeItem(): void {
        return undefined
      },
      key(): string | null {
        return null
      },
      length: 0,
    }
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
    expect(readCardStyle()).toBe('glass')
    writeCardStyle('etch')
  })
})

function installMemoryStorage(): void {
  const memory = new Map<string, string>()
  const storage = {
    getItem(key: string): string | null {
      const value = memory.get(key)
      return value === undefined ? null : value
    },
    setItem(key: string, value: string): void {
      memory.set(key, String(value))
    },
    removeItem(key: string): void {
      memory.delete(key)
    },
    clear(): void {
      memory.clear()
    },
    key(index: number): string | null {
      return [...memory.keys()][index] ?? null
    },
    get length(): number {
      return memory.size
    },
  }
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: storage })
}
