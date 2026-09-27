/** @vitest-environment jsdom */
import { beforeEach, describe, expect, it } from 'vitest'

import { endsWithSkills, shortHomePath, toggleId } from '../src/settings/install-row.tsx'
import { readAuthorMcpAgentIds, writeAuthorMcpAgentIds } from '../src/settings/author-mcp.ts'
import { readSkillAgentIds, readSkillCustomDirs, writeSkillAgentIds, writeSkillCustomDirs } from '../src/settings/skill-dirs.ts'

describe('install dest helpers', () => {
  beforeEach(() => {
    installMemoryStorage()
  })

  it('shortens home paths and toggles picks', () => {
    expect(shortHomePath('/Users/me/.pi/agent/mcp.json')).toBe('~/.pi/agent/mcp.json')
    expect(shortHomePath('/home/me/.pi/agent/mcp.json')).toBe('~/.pi/agent/mcp.json')
    expect(shortHomePath('C:\\Users\\me\\.pi\\agent\\mcp.json')).toBe('~/.pi/agent/mcp.json')
    expect(shortHomePath('/opt/app/mcp.json')).toBe('/opt/app/mcp.json')
    expect(endsWithSkills('~/work/skills')).toBe(true)
    expect(endsWithSkills('skills')).toBe(true)
    expect(endsWithSkills('~/work/skill')).toBe(false)
    const on = toggleId(new Set(), 'pi')
    expect([...on]).toEqual(['pi'])
    expect([...toggleId(on, 'pi')]).toEqual([])
  })

  it('reads remembered dests and ignores broken localStorage', () => {
    writeSkillAgentIds(['pi', '  '])
    writeSkillCustomDirs(['/tmp/skills'])
    writeAuthorMcpAgentIds(['cursor'])
    expect(readSkillAgentIds()).toEqual(['pi'])
    expect(readSkillCustomDirs()).toEqual(['/tmp/skills'])
    expect(readAuthorMcpAgentIds()).toEqual(['cursor'])
    localStorage.setItem('mini-app.panel.skill-agents', '{')
    localStorage.setItem('mini-app.panel.mcp-agents', '[1]')
    localStorage.setItem('mini-app.panel.skill-dirs', 'nope')
    expect(readSkillAgentIds()).toBeUndefined()
    expect(readSkillCustomDirs()).toEqual([])
    expect(readAuthorMcpAgentIds()).toBeUndefined()
    const boom = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    }
    const previous = globalThis.localStorage
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: boom })
    expect(readSkillCustomDirs()).toEqual([])
    writeSkillCustomDirs(['x'])
    writeAuthorMcpAgentIds(['x'])
    Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: previous })
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
