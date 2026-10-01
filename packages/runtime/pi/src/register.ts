import { execFile } from 'node:child_process'
import { existsSync, lstatSync, mkdirSync, rmSync, symlinkSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { ProviderError, type ProviderRegistry, type RuntimeProvider } from '@mohou/runtime-provider'

import { createPiProvider } from './pi.ts'

const peers = ['@earendil-works/pi-coding-agent', '@earendil-works/pi-ai'] as const

let loading: Promise<boolean> | undefined

/**
 * Register Pi and return immediately. Linking and loading run after this call.
 * A failed load leaves the id registered and unhealthy. It does not fail boot.
 */
export function registerPiRuntime(registry: ProviderRegistry): RuntimeProvider {
  const ready = ensurePiLoaded()
  let loaded = false
  void ready.then((ok) => {
    loaded = ok
  })
  const inner = createPiProvider()
  const provider: RuntimeProvider = {
    id: inner.id,
    ...inner.label === undefined ? {} : { label: inner.label },
    configure: (config) => { inner.configure?.(config) },
    start: () => inner.start(),
    stop: () => inner.stop(),
    healthy: () => inner.healthy() && loaded,
    models: () => inner.models?.() ?? Promise.resolve([]),
    async llm(prompt, options) {
      if (!await ready) throw new ProviderError('provider-unhealthy', 'pi is not available')
      return inner.llm(prompt, options)
    },
    async agent(goal, options) {
      if (!await ready) throw new ProviderError('provider-unhealthy', 'pi is not available')
      return inner.agent(goal, options)
    },
  }
  registry.register(provider)
  return provider
}

export function ensurePiLoaded(): Promise<boolean> {
  loading ??= loadPi()
  return loading
}

async function loadPi(): Promise<boolean> {
  if (!peersResolvable()) {
    linkPiPeers(installRoot(), peerRoots(process.execPath, homedir(), process.env))
    if (!peersResolvable()) {
      const global = await npmRootGlobal(process.env)
      if (global !== undefined) linkPiPeers(installRoot(), [global])
    }
  }
  try {
    await import('@earendil-works/pi-coding-agent')
    await import('@earendil-works/pi-ai')
    return true
  } catch {
    return false
  }
}

/** ESM resolve. `require.resolve` throws: these packages export no CJS main. */
function peersResolvable(): boolean {
  return peers.every((name) => {
    try {
      import.meta.resolve(name)
      return true
    } catch {
      return false
    }
  })
}

/** Prefix that contains this package's `node_modules`. */
export function installRoot(): string {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../..')
}

export function peerRoots(node: string, home: string, env: NodeJS.ProcessEnv): string[] {
  const nodeDir = path.dirname(node)
  const prefix = path.dirname(nodeDir)
  const roots = [
    path.join(prefix, 'lib', 'node_modules'),
    path.join(nodeDir, 'node_modules'),
    path.join(nodeDir, 'lib', 'node_modules'),
    path.join(home, 'AppData', 'Roaming', 'npm', 'node_modules'),
  ]
  if (typeof env.APPDATA === 'string' && env.APPDATA.length > 0) {
    const appData = path.join(env.APPDATA, 'npm', 'node_modules')
    if (!roots.includes(appData)) roots.push(appData)
  }
  return roots
}

export function piPackage(root: string, pkg: string): string | undefined {
  const direct = path.join(root, '@earendil-works', pkg)
  if (existsSync(direct)) return direct
  const nested = path.join(root, '@earendil-works', 'pi-coding-agent', 'node_modules', '@earendil-works', pkg)
  return existsSync(nested) ? nested : undefined
}

/** Link both peers into `prefix/node_modules`. A missing package is not an error. */
export function linkPiPeers(prefix: string, roots: readonly string[]): boolean {
  const destRoot = path.join(prefix, 'node_modules', '@earendil-works')
  mkdirSync(destRoot, { recursive: true })
  let linked = false
  for (const pkg of ['pi-coding-agent', 'pi-ai'] as const) {
    const src = roots.map(root => piPackage(root, pkg)).find(item => item !== undefined)
    if (src === undefined) continue
    placeLink(path.join(destRoot, pkg), src)
    linked = true
  }
  return linked
}

function npmRootGlobal(env: NodeJS.ProcessEnv): Promise<string | undefined> {
  const npm = path.join(path.dirname(process.execPath), process.platform === 'win32' ? 'npm.cmd' : 'npm')
  if (!existsSync(npm)) return Promise.resolve(undefined)
  return new Promise((resolve) => {
    execFile(npm, ['root', '-g'], { env, timeout: 5_000 }, (error, stdout) => {
      if (error) {
        resolve(undefined)
        return
      }
      resolve(stdout.split(/\r?\n/).find(line => line.length > 0))
    })
  })
}

function placeLink(dest: string, src: string): void {
  try {
    const stat = lstatSync(dest)
    if (!stat.isSymbolicLink()) return
    rmSync(dest)
  } catch {
    // missing dest
  }
  symlinkSync(src, dest, process.platform === 'win32' ? 'junction' : 'dir')
}
