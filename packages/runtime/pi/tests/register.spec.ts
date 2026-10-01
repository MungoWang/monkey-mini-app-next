import { lstatSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'

import { createProviderRegistry } from '@mohou/runtime-provider'
import { afterEach, describe, expect, it } from 'vitest'

import { linkPiPeers, peerRoots, piPackage, registerPiRuntime } from '../src/register.ts'

const temps: string[] = []

afterEach(() => {
  for (const dir of temps.splice(0)) rmSync(dir, { recursive: true, force: true })
})

describe('registerPiRuntime', () => {
  it('registers pi and returns before the load finishes', () => {
    const registry = createProviderRegistry()
    const started = Date.now()
    const provider = registerPiRuntime(registry)
    expect(Date.now() - started).toBeLessThan(200)
    expect(provider.id).toBe('pi')
    expect(registry.ids()).toContain('pi')
    expect(registry.get('pi')).toBe(provider)
    expect(provider.healthy()).toBe(false)
  })
})

describe('linkPiPeers', () => {
  it('links a global package and leaves a real directory alone', () => {
    const root = temp()
    const global = path.join(root, 'global')
    const prefix = path.join(root, 'prefix')
    mkdirSync(path.join(global, '@earendil-works', 'pi-coding-agent'), { recursive: true })
    writeFileSync(path.join(global, '@earendil-works', 'pi-coding-agent', 'package.json'), '{}\n')
    mkdirSync(path.join(prefix, 'node_modules', '@earendil-works', 'pi-ai'), { recursive: true })
    writeFileSync(path.join(prefix, 'node_modules', '@earendil-works', 'pi-ai', 'keep'), 'real\n')
    expect(piPackage(global, 'pi-coding-agent')).toBe(path.join(global, '@earendil-works', 'pi-coding-agent'))
    expect(linkPiPeers(prefix, [global])).toBe(true)
    const linked = path.join(prefix, 'node_modules', '@earendil-works', 'pi-coding-agent')
    expect(lstatSync(linked).isSymbolicLink()).toBe(true)
    expect(lstatSync(path.join(prefix, 'node_modules', '@earendil-works', 'pi-ai')).isSymbolicLink()).toBe(false)
  })

  it('finds a package nested under pi-coding-agent', () => {
    const root = temp()
    const nested = path.join(root, '@earendil-works', 'pi-coding-agent', 'node_modules', '@earendil-works', 'pi-ai')
    mkdirSync(nested, { recursive: true })
    expect(piPackage(root, 'pi-ai')).toBe(nested)
    expect(piPackage(root, 'missing')).toBeUndefined()
  })
})

describe('peerRoots', () => {
  it('includes the node prefix and does not repeat APPDATA', () => {
    const roots = peerRoots('/node/bin/node', '/home/me', { APPDATA: '/home/me/AppData/Roaming' })
    expect(roots[0]).toBe(path.join('/node', 'lib', 'node_modules'))
    expect(roots.filter(root => root === path.join('/home/me/AppData/Roaming', 'npm', 'node_modules'))).toHaveLength(1)
  })
})

function temp(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'mma-pi-link-'))
  temps.push(dir)
  return dir
}
