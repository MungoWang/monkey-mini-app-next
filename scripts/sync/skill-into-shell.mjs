#!/usr/bin/env node
/**
 * Align skill version with @mini-app/shell and copy the skill tree into the shell package.
 *
 * Inputs: packages/shell/package.json, skills/monkey-mini-app/**
 * Writes: skills/monkey-mini-app/SKILL.md version field;
 *         packages/shell/skill/monkey-mini-app/** (packaged copy)
 * Run as: node scripts/sync/skill-into-shell.mjs
 *         pnpm sync:skill
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
export const shellPkgPath = join(root, 'packages/shell/package.json')
export const skillSrc = join(root, 'skills/monkey-mini-app')
export const skillMd = join(skillSrc, 'SKILL.md')
export const skillDest = join(root, 'packages/shell/skill/monkey-mini-app')

export function readShellVersion(file = shellPkgPath) {
  const pkg = JSON.parse(readFileSync(file, 'utf8'))
  if (typeof pkg.version !== 'string' || !/^\d+\.\d+\.\d+$/.test(pkg.version)) {
    throw new Error(`shell package version missing or invalid in ${file}`)
  }
  return pkg.version
}

export function readSkillVersion(file = skillMd) {
  const text = readFileSync(file, 'utf8')
  if (!text.startsWith('---')) return null
  const end = text.indexOf('\n---', 3)
  if (end < 0) return null
  const match = /^version:\s*["']?(\d+\.\d+\.\d+)["']?\s*$/m.exec(text.slice(3, end))
  return match?.[1] ?? null
}

export function setSkillVersion(markdown, version) {
  if (!markdown.startsWith('---')) throw new Error('SKILL.md must start with YAML frontmatter')
  const end = markdown.indexOf('\n---', 3)
  if (end < 0) throw new Error('SKILL.md frontmatter is not closed')
  const head = markdown.slice(0, end + 1)
  const tail = markdown.slice(end + 1)
  if (/^version:\s*/m.test(head)) {
    return `${head.replace(/^version:\s*.*$/m, `version: ${version}`)}${tail}`
  }
  return `---\nversion: ${version}\n${markdown.slice(4)}`
}

/** Write K≡S into SKILL.md and copy skills/ → packages/shell/skill/. */
export function syncSkillIntoShell(repoRoot = root) {
  const shellFile = join(repoRoot, 'packages/shell/package.json')
  const src = join(repoRoot, 'skills/monkey-mini-app')
  const md = join(src, 'SKILL.md')
  const dest = join(repoRoot, 'packages/shell/skill/monkey-mini-app')
  if (!existsSync(md)) throw new Error(`missing ${md}`)
  const shellVersion = readShellVersion(shellFile)
  const previous = readSkillVersion(md)
  const body = readFileSync(md, 'utf8')
  const next = setSkillVersion(body, shellVersion)
  if (next !== body) writeFileSync(md, next)
  rmSync(dest, { recursive: true, force: true })
  mkdirSync(dirname(dest), { recursive: true })
  cpSync(src, dest, { recursive: true })
  return { shellVersion, previous, dest }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = syncSkillIntoShell()
  console.log(
    `skill version ${result.previous ?? '(none)'} → ${result.shellVersion}; copied to packages/shell/skill/monkey-mini-app`,
  )
}
