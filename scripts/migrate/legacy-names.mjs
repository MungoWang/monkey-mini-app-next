#!/usr/bin/env node
/**
 * Move a runtime root off the retired npm scopes, and clear stale local packs.
 *
 * The publish set, the shell, and the author skill were renamed: the retired scopes are
 * `@mohou/…` now. An app written before the rename keeps the old specifier and fails to
 * compile. This rewrites app source, leaves app data alone, and moves `mini-app-*.tgz` out of
 * the local pack directory: a renamed tarball would still install `node_modules/@mini-app/shell`,
 * so those files cannot be salvaged.
 *
 * Inputs: <root>/apps/<appId> sources, the local pack directory
 * Writes: app source with --write; the backup directory with --write
 * Side effects: none without --write
 * Run as: pnpm migrate:legacy [--write]
 *         node scripts/migrate/legacy-names.mjs --root <dir> --packs <dir> --backup <dir>
 */
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

/** Retired scope → current scope. Longest `from` first so a subpath maps whole. */
export const legacySpecifiers = [
  { from: '@monkey-mini-app/ui', to: '@mohou/ui' },
  { from: '@monkey-mini-app/contract', to: '@mohou/contract' },
  { from: '@mini-app/', to: '@mohou/' },
]

/** File kinds an app holds source in. Anything else is data or a build cache. */
export const sourceExtensions = ['.ts', '.tsx', '.js', '.mjs', '.css', '.json', '.md', '.html']

/** Trees this never rewrites: app data, logs, and output a reload rebuilds. */
export const skippedTrees = ['.autogen', 'storage', 'logs', 'dist', '.cache', 'node_modules']

const unmappedPattern = /@(?:mini-app|monkey-mini-app)\/[A-Za-z0-9._/-]+/g
const retiredPattern = /@(?:mini-app|monkey-mini-app)\//

/** Every replacement the text needs, plus any retired name the table cannot express. */
export function rewriteSpecifiers(text) {
  let next = text
  const hits = []
  for (const entry of legacySpecifiers) {
    const count = next.split(entry.from).length - 1
    if (count === 0) continue
    next = next.split(entry.from).join(entry.to)
    hits.push({ ...entry, count })
  }
  const unmapped = [...new Set(`${text}\n${next}`.match(unmappedPattern) ?? [])]
    .filter(name => !legacySpecifiers.some(entry => name.startsWith(entry.from) || name.startsWith(entry.to)))
  return { text: next, hits, unmapped }
}

function walkSource(dir, base, out) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      if (skippedTrees.includes(entry.name)) continue
      walkSource(full, base, out)
      continue
    }
    if (!sourceExtensions.some(extension => entry.name.endsWith(extension))) continue
    out.push(relative(base, full))
  }
  return out
}

/**
 * True when the generated bundle still names a retired scope. The host serves `.autogen`
 * while its stamp matches the sources, and a stamp is one mtime plus a file count, so a
 * restored tree can keep it equal after an edit.
 */
function autogenNamesRetired(appDir) {
  const autogen = join(appDir, '.autogen')
  if (!existsSync(autogen)) return false
  return readdirSync(autogen).some(name => retiredPattern.test(readFileSync(join(autogen, name), 'utf8')))
}

/** What the migration would do. Reads only; the caller decides whether to write. */
export function planMigration(input) {
  const root = input.root
  const packsDir = input.packsDir
  const edits = []
  const caches = []
  const unmapped = []
  const appsDir = join(root, 'apps')
  const appIds = existsSync(appsDir)
    ? readdirSync(appsDir, { withFileTypes: true }).filter(entry => entry.isDirectory()).map(entry => entry.name).sort()
    : []
  for (const appId of appIds) {
    const appDir = join(appsDir, appId)
    for (const rel of walkSource(appDir, appDir, []).sort()) {
      const text = readFileSync(join(appDir, rel), 'utf8')
      const { hits, unmapped: missed } = rewriteSpecifiers(text)
      if (hits.length > 0) edits.push({ appId, rel, hits })
      for (const name of missed) unmapped.push({ appId, rel, name })
    }
    const rewritten = edits.some(edit => edit.appId === appId)
    if (rewritten) caches.push({ appId, reason: 'rewritten source' })
    else if (autogenNamesRetired(appDir)) caches.push({ appId, reason: 'bundle names a retired scope' })
  }
  const packs = existsSync(packsDir)
    ? readdirSync(packsDir).filter(name => /^mini-app-.*\.tgz$/.test(name)).sort()
    : []
  return { root, packsDir, appIds, edits, caches, packs, unmapped }
}

/** Write the planned edits, copying each file it touches into the backup first. */
export function applyMigration(plan, backupDir) {
  const written = []
  const backedUp = []
  for (const edit of plan.edits) {
    const source = join(plan.root, 'apps', edit.appId, edit.rel)
    const target = join(backupDir, 'apps', edit.appId, edit.rel)
    mkdirSync(dirname(target), { recursive: true })
    cpSync(source, target)
    backedUp.push(relative(backupDir, target))
    const { text } = rewriteSpecifiers(readFileSync(source, 'utf8'))
    writeFileSync(source, text)
    written.push(join('apps', edit.appId, edit.rel))
  }
  const clearedCaches = []
  for (const cache of plan.caches) {
    const source = join(plan.root, 'apps', cache.appId, '.autogen')
    if (!existsSync(source)) continue
    const target = join(backupDir, 'apps', cache.appId, '.autogen')
    mkdirSync(dirname(target), { recursive: true })
    renameSync(source, target)
    clearedCaches.push(cache.appId)
  }
  const movedPacks = []
  for (const name of plan.packs) {
    const target = join(backupDir, 'packs', name)
    mkdirSync(dirname(target), { recursive: true })
    renameSync(join(plan.packsDir, name), target)
    movedPacks.push(name)
  }
  return { written, backedUp, clearedCaches, movedPacks }
}

export function defaultPaths(env = process.env, home = homedir()) {
  return {
    root: env.MINI_APP_RUNTIME && env.MINI_APP_RUNTIME.length > 0
      ? env.MINI_APP_RUNTIME
      : join(home, '.mini-app', 'runtime'),
    packsDir: join(home, '.mini-app', 'packages'),
  }
}

/** True when the plan changes something. A write run skips the backup when it does not. */
export function hasWork(plan) {
  return plan.edits.length + plan.caches.length + plan.packs.length > 0
}

function parseArgs(argv) {
  const options = { write: false, root: undefined, packsDir: undefined, backupDir: undefined }
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]
    if (arg === '--write') options.write = true
    else if (arg === '--root') options.root = argv[++index]
    else if (arg === '--packs') options.packsDir = argv[++index]
    else if (arg === '--backup') options.backupDir = argv[++index]
    else if (arg !== '--') throw new Error(`migrate:legacy: unknown argument ${arg}`)
  }
  return options
}

function stamp() {
  return new Date().toISOString().slice(0, 19).replaceAll(':', '').replace('T', '-')
}

function report(plan, options) {
  console.log(`runtime root: ${plan.root}`)
  console.log(`apps: ${plan.appIds.length}${plan.appIds.length > 0 ? ` (${plan.appIds.join(', ')})` : ''}`)
  for (const edit of plan.edits) {
    const detail = edit.hits.map(hit => `${hit.from} → ${hit.to} ×${hit.count}`).join(', ')
    console.log(`  ${edit.appId}/${edit.rel}: ${detail}`)
  }
  if (plan.edits.length === 0) console.log('  no retired specifier in app source')
  for (const cache of plan.caches) console.log(`  cache: .autogen of ${cache.appId} — ${cache.reason}`)
  console.log(`packs: ${plan.packs.length} stale tarball(s) in ${plan.packsDir}`)
  for (const name of plan.packs) console.log(`  ${name}`)
  for (const missed of plan.unmapped) {
    console.log(`  unmapped: ${missed.appId}/${missed.rel}: ${missed.name} — no replacement in the table`)
  }
  if (options.write) return
  const changes = plan.edits.length + plan.caches.length + plan.packs.length
  console.log(changes === 0 ? 'dry run: nothing to do' : 'dry run: nothing written. Re-run with --write.')
}

function main() {
  const options = parseArgs(process.argv.slice(2))
  const paths = defaultPaths()
  const root = options.root ?? paths.root
  const packsDir = options.packsDir ?? paths.packsDir
  if (!existsSync(root)) throw new Error(`migrate:legacy: runtime root is missing: ${root}`)
  const plan = planMigration({ root, packsDir })
  report(plan, options)
  if (!options.write) return
  if (!hasWork(plan)) return
  const backupDir = options.backupDir ?? join(dirname(root), `migration-backup-${stamp()}`)
  if (existsSync(backupDir)) throw new Error(`migrate:legacy: backup directory exists: ${backupDir}`)
  const result = applyMigration(plan, backupDir)
  console.log(`backup: ${backupDir}`)
  console.log(`wrote ${result.written.length} file(s), cleared ${result.clearedCaches.length} .autogen cache(s), moved ${result.movedPacks.length} tarball(s)`)
  if (result.written.length > 0) {
    console.log('A view already open in a panel still runs the bundle it loaded: reload it with')
    console.log('  POST /api/apps/<appId>/reload   (a fresh compile follows the source stamp)')
  }
  if (result.movedPacks.length > 0) {
    console.log('Rebuild the local channel to repopulate the pack directory: pnpm dist:app:local')
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main()
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
