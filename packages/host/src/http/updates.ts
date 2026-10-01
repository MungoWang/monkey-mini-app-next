import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import path from 'node:path'

import { homePackagesDir } from '../host/layout.ts'
import { aboutInfo } from './ports.ts'

export interface UpdateCheck {
  readonly name: string
  readonly current: string
  readonly latest: string | null
  readonly updateAvailable: boolean
  readonly channel?: 'registry' | 'tarball'
  readonly installable?: boolean
  readonly error?: string
}

interface PrefixUpdate {
  readonly dir: string
  readonly channel: 'registry' | 'tarball'
  readonly registry?: string
  readonly tarballDir?: string
  readonly packages: readonly string[]
}

/** Ask the install channel once. A dev tree with no prefix still asks the registry and cannot install. */
export async function checkPackageUpdate(
  about: ReturnType<typeof aboutInfo> = aboutInfo(),
  env: NodeJS.ProcessEnv = process.env,
  cwd = process.cwd(),
): Promise<UpdateCheck> {
  const empty = { name: about.name, current: about.current, latest: null, updateAvailable: false }
  if (about.name.length === 0) return { ...empty, error: 'package name is missing' }
  const prefix = readPrefixUpdate(cwd, env)
  if (prefix?.channel === 'tarball') {
    const latest = newestTarball(prefix.tarballDir ?? homePackagesDir(homedir()), 'shell')
    return {
      name: '@mohou/shell',
      current: about.current,
      latest,
      channel: 'tarball',
      installable: true,
      updateAvailable: latest !== null && compareVersion(latest, about.current) > 0,
    }
  }
  if (about.private && prefix === undefined) return { ...empty, latest: about.current, installable: false }
  const registry = prefix?.registry ?? 'https://registry.npmjs.org'
  const name = prefix === undefined ? about.name : '@mohou/shell'
  try {
    const response = await fetch(`${registry.replace(/\/$/, '')}/${name}/latest`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!response.ok) return { ...empty, name, ...prefix === undefined ? {} : { channel: prefix.channel }, installable: prefix !== undefined, error: `package registry returned ${response.status}` }
    const body = await response.json() as { version?: unknown }
    const latest = typeof body.version === 'string' ? body.version : null
    return {
      name,
      current: about.current,
      latest,
      channel: prefix?.channel ?? 'registry',
      installable: prefix !== undefined,
      updateAvailable: latest !== null && latest !== about.current,
    }
  } catch (error) {
    return { ...empty, name, ...prefix === undefined ? {} : { channel: prefix.channel }, installable: prefix !== undefined, error: error instanceof Error ? error.message : 'update check failed' }
  }
}

/** Write `update.json` for the launcher to run after this process exits. */
export function stagePackageUpdate(version: string, env: NodeJS.ProcessEnv = process.env, cwd = process.cwd()): void {
  const prefix = readPrefixUpdate(cwd, env)
  if (prefix === undefined) throw new Error('update install needs an app prefix')
  if (prefix.channel === 'tarball') {
    const args = tarballInstallArgs(prefix, version)
    writeFileSync(path.join(prefix.dir, 'update.json'), `${JSON.stringify({ args })}\n`)
    return
  }
  const args = ['install', `@mohou/shell@${version}`, ...installFlags(), '--registry', prefix.registry ?? 'https://registry.npmjs.org']
  writeFileSync(path.join(prefix.dir, 'update.json'), `${JSON.stringify({ args })}\n`)
}

function installFlags(): string[] {
  return ['--no-fund', '--no-audit', '--omit=peer', '--fetch-retries=1', '--fetch-timeout=20000']
}

function tarballInstallArgs(prefix: PrefixUpdate, version: string): string[] {
  const dir = prefix.tarballDir ?? homePackagesDir(homedir())
  const specs = prefix.packages.map((name) => {
    const file = path.join(dir, packedName(name, version))
    return `file:${file.replaceAll('\\', '/')}`
  })
  return ['install', ...specs, ...installFlags()]
}

function packedName(packageName: string, version: string): string {
  return `${packageName.replace(/^@/, '').replaceAll('/', '-')}-${version}.tgz`
}

export function newestTarball(dir: string, slug: string): string | null {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return null
  }
  const versions = names.flatMap((name) => {
    const match = new RegExp(`^mohou-${slug}-(\\d+\\.\\d+\\.\\d+)\\.tgz$`).exec(name)
    return match?.[1] === undefined ? [] : [match[1]]
  })
  return versions.sort(compareVersion).at(-1) ?? null
}

function compareVersion(left: string, right: string): number {
  const a = left.split('.').map(part => Number(part))
  const b = right.split('.').map(part => Number(part))
  const width = Math.max(a.length, b.length)
  for (let index = 0; index < width; index += 1) {
    const av = a[index] ?? 0
    const bv = b[index] ?? 0
    if (av !== bv) return av > bv ? 1 : -1
  }
  return 0
}

function readPrefixUpdate(cwd: string, env: NodeJS.ProcessEnv): PrefixUpdate | undefined {
  const dir = findPrefix(cwd)
  if (dir === undefined) return undefined
  const parsed = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as {
    dependencies?: Record<string, string>
    mohou?: { channel?: string; registry?: string; tarballDir?: string }
  }
  const channel = parsed.mohou?.channel
  if (channel !== 'registry' && channel !== 'tarball') return undefined
  const packages = Object.keys(parsed.dependencies ?? {}).filter(name => name.startsWith('@mohou/'))
  const override = env.MINI_APP_TARBALL_DIR
  const tarballDir = override !== undefined && override.length > 0 ? override : parsed.mohou?.tarballDir
  return {
    dir,
    channel,
    ...typeof parsed.mohou?.registry === 'string' ? { registry: parsed.mohou.registry } : {},
    ...tarballDir === undefined ? {} : { tarballDir },
    packages: packages.length === 0 ? ['@mohou/shell'] : packages,
  }
}

function findPrefix(start: string): string | undefined {
  let dir = path.resolve(start)
  for (let depth = 0; depth < 8; depth += 1) {
    try {
      const parsed = JSON.parse(readFileSync(path.join(dir, 'package.json'), 'utf8')) as { name?: string }
      if (parsed.name === 'mohou-app') return dir
    } catch {
      // keep walking
    }
    const parent = path.dirname(dir)
    if (parent === dir) return undefined
    dir = parent
  }
  return undefined
}
