import { spawn } from 'node:child_process'
import { readFile, rm, writeFile } from 'node:fs/promises'

import { InstallError } from './codes.ts'
import { installLayout, packageLock, packageManifest } from './layout.ts'

/** Names an app must not install. The message names the replacement. */
const DENIED: Record<string, string> = {
  react: 'use the UI kit',
  'react-dom': 'use the UI kit',
  lodash: 'use the platform lodash import',
  'lodash-es': 'use the platform lodash import',
  axios: 'use ctx.http',
  typescript: 'typescript is not an app dependency',
  motion: 'use the platform motion import',
  'framer-motion': 'use the platform motion import',
}

/** Platform scope. These packages are already provided. */
const PLATFORM_SCOPE = '@mohou/'

const NAME = /^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/
const VERSION = /^[0-9A-Za-z.^~=*-]+$/

/** Install timeout when the caller omits one. Host policy, not a locked number. */
export const DEFAULT_INSTALL_TIMEOUT_MS = 120_000

export interface InstallRequest {
  packages: Array<{ name: string; version?: string }>
  remove: string[]
}

export interface InstallResult {
  ok: boolean
  packages: Record<string, string>
  lockfile: string | null
  code?: 'install-denied' | 'install-failed'
  message?: string
}

/** Runs `npm install` in the app directory. Tests replace this. */
export type NpmRun = (appDir: string, signal: AbortSignal) => Promise<{ exitCode: number; stderr: string }>

/**
 * Read or change one app's dependencies. This is the only writer of `package.json`.
 * A failed install restores the previous manifest and lockfile.
 * @param appDir - absolute app directory
 * @param request - admitted add and remove lists; both empty means read
 * @param options - timeout and the npm runner
 */
export async function installApp(
  appDir: string,
  request: InstallRequest,
  options: { timeoutMs?: number; run?: NpmRun } = {},
): Promise<InstallResult> {
  const current = await readManifest(appDir)
  if (request.packages.length === 0 && request.remove.length === 0) {
    return { ok: true, packages: current.packages, lockfile: current.lockfile }
  }
  const denied = deniedSpec(request)
  if (denied !== undefined) return { ok: false, packages: current.packages, lockfile: current.lockfile, ...denied }
  const next = applyRequest(current.packages, request)
  const previousJson = current.raw
  const previousLock = current.lockRaw
  await writeManifest(appDir, next)
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort()
  }, options.timeoutMs ?? DEFAULT_INSTALL_TIMEOUT_MS)
  try {
    const run = options.run ?? runNpm
    const result = await run(appDir, controller.signal)
    if (result.exitCode !== 0) {
      await restore(appDir, previousJson, previousLock)
      return failed(current, 'install-failed', result.stderr || 'npm install failed')
    }
    const pinned = await pinResolved(appDir, next)
    await writeManifest(appDir, pinned)
    return { ok: true, packages: pinned, lockfile: installLayout.lockfile }
  } catch (error) {
    await restore(appDir, previousJson, previousLock)
    const message = controller.signal.aborted
      ? 'npm install timed out'
      : error instanceof Error ? error.message : 'npm install failed'
    return failed(current, 'install-failed', message)
  } finally {
    clearTimeout(timer)
  }
}

/** Spawn npm. Package names stay in `package.json`, not on the command line. */
export function runNpm(appDir: string, signal: AbortSignal): Promise<{ exitCode: number; stderr: string }> {
  const bin = process.platform === 'win32' ? 'npm.cmd' : 'npm'
  return new Promise((resolve, reject) => {
    const child = spawn(bin, ['install', '--ignore-scripts', '--omit=dev'], {
      cwd: appDir,
      signal,
      windowsHide: true,
      shell: process.platform === 'win32',
    })
    let stderr = ''
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.once('error', reject)
    child.once('close', (code) => {
      resolve({ exitCode: code ?? 1, stderr })
    })
  })
}

function deniedSpec(request: InstallRequest): { code: 'install-denied'; message: string } | undefined {
  for (const item of request.packages) {
    const reason = denyName(item.name) ?? denyVersion(item.version)
    if (reason !== undefined) return { code: 'install-denied', message: reason }
  }
  for (const name of request.remove) {
    const reason = denyName(name)
    if (reason !== undefined) return { code: 'install-denied', message: reason }
  }
  return undefined
}

function denyName(name: string): string | undefined {
  if (!NAME.test(name)) return `package name is not a plain npm name: ${name}`
  if (name.startsWith(PLATFORM_SCOPE)) return `use the platform import instead of installing ${name}`
  const replacement = DENIED[name]
  return replacement === undefined ? undefined : `${name} is denied: ${replacement}`
}

function denyVersion(version: string | undefined): string | undefined {
  if (version === undefined) return undefined
  if (!VERSION.test(version)) return `package version is not a plain range: ${version}`
  return undefined
}

function applyRequest(current: Record<string, string>, request: InstallRequest): Record<string, string> {
  const removed = new Set(request.remove)
  const next: Record<string, string> = {}
  for (const [name, version] of Object.entries(current)) {
    if (!removed.has(name)) next[name] = version
  }
  for (const item of request.packages) next[item.name] = item.version ?? '*'
  return next
}

async function readManifest(appDir: string): Promise<{
  packages: Record<string, string>
  lockfile: string | null
  raw?: string
  lockRaw?: string
}> {
  const raw = await readFile(packageManifest(appDir), 'utf8').catch(() => undefined)
  const lockRaw = await readFile(packageLock(appDir), 'utf8').catch(() => undefined)
  if (raw === undefined) {
    return {
      packages: {},
      lockfile: lockRaw === undefined ? null : installLayout.lockfile,
      ...lockRaw === undefined ? {} : { lockRaw },
    }
  }
  let parsed: unknown
  try {
    parsed = JSON.parse(raw) as unknown
  } catch (error) {
    throw new InstallError('install-failed', 'package.json is not JSON', { cause: error })
  }
  const dependencies = isRecord(parsed) ? parsed.dependencies : undefined
  const packages: Record<string, string> = {}
  if (isRecord(dependencies)) {
    for (const [name, version] of Object.entries(dependencies)) {
      if (typeof version === 'string') packages[name] = version
    }
  }
  return {
    packages,
    lockfile: lockRaw === undefined ? null : installLayout.lockfile,
    raw,
    ...lockRaw === undefined ? {} : { lockRaw },
  }
}

async function writeManifest(appDir: string, packages: Record<string, string>): Promise<void> {
  const body = {
    private: true,
    dependencies: packages,
  }
  await writeFile(packageManifest(appDir), `${JSON.stringify(body, null, 2)}\n`)
}

async function restore(appDir: string, raw: string | undefined, lockRaw: string | undefined): Promise<void> {
  const manifest = packageManifest(appDir)
  const lock = packageLock(appDir)
  if (raw === undefined) await rm(manifest, { force: true })
  else await writeFile(manifest, raw)
  if (lockRaw === undefined) await rm(lock, { force: true })
  else await writeFile(lock, lockRaw)
}

async function pinResolved(appDir: string, requested: Record<string, string>): Promise<Record<string, string>> {
  const text = await readFile(packageLock(appDir), 'utf8').catch(() => undefined)
  if (text === undefined) return requested
  let parsed: unknown
  try {
    parsed = JSON.parse(text) as unknown
  } catch {
    return requested
  }
  const pinned = { ...requested }
  if (!isRecord(parsed)) return pinned
  const packages = isRecord(parsed.packages) ? parsed.packages : {}
  for (const name of Object.keys(pinned)) {
    const entry = packages[`${installLayout.modules}/${name}`]
    const version = isRecord(entry) && typeof entry.version === 'string' ? entry.version : undefined
    if (version !== undefined) pinned[name] = version
  }
  return pinned
}

function failed(
  current: { packages: Record<string, string>; lockfile: string | null },
  code: 'install-failed',
  message: string,
): InstallResult {
  return { ok: false, packages: current.packages, lockfile: current.lockfile, code, message }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
