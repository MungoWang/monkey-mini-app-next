import { existsSync } from 'node:fs'
import { spawn, type ChildProcess, type SpawnOptions } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export type WindowSpawn = (command: string, args: readonly string[], options: SpawnOptions) => ChildProcess

/**
 * The panel window may open only the loopback origin Shell started.
 * @param origin - `http://127.0.0.1:<port>` or `http://localhost:<port>`
 */
export function admitWindowOrigin(origin: string): string {
  let url: URL
  try {
    url = new URL(origin)
  } catch {
    throw new Error(`panel window origin is invalid: ${origin}`)
  }
  if (url.protocol !== 'http:') throw new Error('panel window origin must be http')
  if (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('panel window origin must be loopback')
  }
  if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
    throw new Error('panel window origin must not include a path')
  }
  return url.origin
}

/** Binary file name. Windows adds `.exe`. Other platforms are not a window target. */
export function windowBinaryName(platform: string): string {
  if (platform === 'darwin') return 'mini-app-window'
  if (platform === 'win32') return 'mini-app-window.exe'
  throw new Error(`panel window is not implemented on ${platform}`)
}

/**
 * Prefer the release binary, then the debug binary.
 * @param platform - `darwin` or `win32`
 */
export function windowBinaryPath(platform = process.platform): string {
  const name = windowBinaryName(platform)
  // Launcher crate lives outside the shell npm package: packages/launcher/tauri
  const target = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../launcher/tauri/target')
  const release = path.join(target, 'release', name)
  const debug = path.join(target, 'debug', name)
  if (existsSync(release)) return release
  if (existsSync(debug)) return debug
  return release
}

/**
 * Command that opens the panel origin in the Tauri window.
 * @param origin - loopback origin
 * @param platform - defaults to this process
 * @param binary - override used by tests; production resolves `windowBinaryPath`
 */
export function panelWindowCommand(
  origin: string,
  platform = process.platform,
  binary = windowBinaryPath(platform),
): { command: string; args: string[] } {
  const admitted = admitWindowOrigin(origin)
  return { command: binary, args: [admitted] }
}

/**
 * Open the panel origin in the Tauri window. The caller owns the child.
 * A missing binary throws before spawn. The page has no Tauri IPC.
 * @param origin - loopback origin Shell started
 * @param run - spawn, defaulting to `child_process.spawn`
 * @param binary - override used by tests
 */
export function openPanelWindow(origin: string, run?: WindowSpawn, binary?: string): ChildProcess {
  const launched = panelWindowCommand(origin, process.platform, binary)
  if (binary === undefined && !existsSync(launched.command)) {
    throw new Error(`panel window is not built: ${launched.command}. Run pnpm build:window`)
  }
  return (run ?? spawn)(launched.command, launched.args, { stdio: 'ignore' })
}
