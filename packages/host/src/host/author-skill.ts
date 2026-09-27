import { spawn } from 'node:child_process'
import { access, cp, mkdir, readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

import { ConfigError } from './codes.ts'

/** One assistant folder Shell named. `skillsDir` is the parent `skills` directory. */
export interface AuthorSkillAgent {
  readonly id: string
  readonly label: string
  readonly skillsDir: string
  readonly detectDir: string
}

export interface AuthorSkillLayout {
  readonly source: string
  readonly agents: readonly AuthorSkillAgent[]
}

export interface AuthorSkillCopyStatus {
  readonly dest: string
  readonly installed: boolean
  readonly version: string | null
  readonly updateAvailable: boolean
}

export interface AuthorSkillAgentStatus extends AuthorSkillAgent, AuthorSkillCopyStatus {
  readonly homePresent: boolean
}

export interface AuthorSkillStatus {
  readonly skillId: string
  readonly version: string | null
  readonly agents: readonly AuthorSkillAgentStatus[]
  readonly customs: readonly (AuthorSkillCopyStatus & { readonly dir: string })[]
}

/** Skill folder name taken from the source directory. */
export function skillIdOf(source: string): string {
  const id = path.basename(source).trim()
  if (id.length === 0) throw new ConfigError('config-invalid', 'author skill source is invalid')
  return id
}

/**
 * Admit a custom skills parent. The last segment must be `skills`.
 * @param raw - path the panel sent
 * @param home - for expanding `~`
 */
export function admitSkillsDir(raw: string, home: string): string {
  const trimmed = raw.trim()
  if (trimmed.length === 0) throw new ConfigError('config-invalid', 'skill directory is empty')
  const expanded = trimmed.startsWith('~/') || trimmed === '~'
    ? path.join(home, trimmed.slice(1).replace(/^[\\/]/, ''))
    : trimmed
  const resolved = path.resolve(expanded)
  if (path.basename(resolved) !== 'skills') {
    throw new ConfigError('config-invalid', 'skill directory must end with skills')
  }
  return resolved
}

/** `x.y.z` from the first YAML block of SKILL.md. Anything else is absent. */
export function skillVersionOf(markdown: string): string | null {
  if (!markdown.startsWith('---')) return null
  const end = markdown.indexOf('\n---', 3)
  if (end < 0) return null
  const match = /^version:\s*["']?([0-9]+\.[0-9]+\.[0-9]+)["']?\s*$/m.exec(markdown.slice(3, end))
  return match?.[1] ?? null
}

export async function readAuthorSkill(
  layout: AuthorSkillLayout,
  customDirs: readonly string[] = [],
  home = homedir(),
): Promise<AuthorSkillStatus> {
  const skillId = skillIdOf(layout.source)
  const version = await readSkillVersion(path.join(layout.source, 'SKILL.md'))
  const agents = await Promise.all(layout.agents.map(async (agent) => {
    const dest = path.join(agent.skillsDir, skillId)
    const copy = await copyStatus(dest, version)
    return {
      ...agent,
      ...copy,
      homePresent: await present(agent.detectDir),
    }
  }))
  const customs = await Promise.all(customDirs.map(async (raw) => {
    const dir = admitSkillsDir(raw, home)
    const dest = path.join(dir, skillId)
    return { dir, ...await copyStatus(dest, version) }
  }))
  return { skillId, version, agents, customs }
}

/**
 * Copy the skill into each selected assistant or custom skills dir.
 */
export async function writeAuthorSkill(
  layout: AuthorSkillLayout,
  agentIds: readonly string[],
  customDirs: readonly string[],
  home = homedir(),
): Promise<AuthorSkillStatus> {
  await access(path.join(layout.source, 'SKILL.md'))
  const skillId = skillIdOf(layout.source)
  const selected = layout.agents.filter(agent => agentIds.includes(agent.id))
  const dirs = [...selected.map(agent => agent.skillsDir), ...customDirs.map(raw => admitSkillsDir(raw, home))]
  for (const dir of dirs) {
    const dest = path.join(dir, skillId)
    await mkdir(dir, { recursive: true })
    await cp(layout.source, dest, { recursive: true, force: true })
  }
  return readAuthorSkill(layout, customDirs, home)
}

/** Open a dest this layout already owns. */
export async function revealAuthorSkill(
  layout: AuthorSkillLayout,
  dest: string,
  home = homedir(),
  platform = process.platform,
): Promise<void> {
  const status = await readAuthorSkill(layout, [], home)
  const allowed = new Set(status.agents.map(agent => agent.dest))
  const resolved = path.resolve(dest)
  if (!allowed.has(resolved) && path.basename(path.dirname(resolved)) !== 'skills') {
    throw new ConfigError('config-invalid', 'skill folder is not in the list')
  }
  if (path.basename(path.dirname(resolved)) === 'skills') admitSkillsDir(path.dirname(resolved), home)
  await access(path.join(resolved, 'SKILL.md'))
  await openDir(resolved, platform)
}

async function copyStatus(dest: string, sourceVersion: string | null): Promise<AuthorSkillCopyStatus> {
  const installed = await hasSkill(dest)
  const version = installed ? await readSkillVersion(path.join(dest, 'SKILL.md')) : null
  return {
    dest,
    installed,
    version,
    updateAvailable: installed && sourceVersion !== null && (version === null || compareSkillVersion(sourceVersion, version) > 0),
  }
}

async function readSkillVersion(file: string): Promise<string | null> {
  try {
    return skillVersionOf(await readFile(file, 'utf8'))
  } catch {
    return null
  }
}

function compareSkillVersion(left: string, right: string): number {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let i = 0; i < 3; i++) {
    const delta = (a[i] ?? 0) - (b[i] ?? 0)
    if (delta !== 0) return delta > 0 ? 1 : -1
  }
  return 0
}

async function hasSkill(dest: string): Promise<boolean> {
  try {
    await access(path.join(dest, 'SKILL.md'))
    return true
  } catch {
    return false
  }
}

async function present(dir: string): Promise<boolean> {
  try {
    await access(dir)
    return true
  } catch {
    return false
  }
}

function openDir(dir: string, platform: string): Promise<void> {
  const launched = platform === 'win32'
    ? { command: 'explorer', args: [dir] }
    : platform === 'darwin'
      ? { command: 'open', args: [dir] }
      : undefined
  if (launched === undefined) throw new ConfigError('config-invalid', `open folder is not implemented on ${platform}`)
  return new Promise((resolve, reject) => {
    const child = spawn(launched.command, launched.args, { stdio: 'ignore', detached: true })
    child.once('error', reject)
    child.unref()
    resolve()
  })
}
