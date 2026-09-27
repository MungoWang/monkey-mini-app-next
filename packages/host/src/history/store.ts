import fs from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

import git from 'isomorphic-git'

import type { FileCommit } from '../files/tools.ts'
import { gitDir, snapshotSkip } from '../files/skip.ts'
import { HistoryError } from './codes.ts'

/** Host identity for snapshots. Not a person, and not a locked product field. */
const AUTHOR = { name: 'mini-app', email: 'history@localhost' }

/** List depth when the caller omits one. Host policy, not a locked number. */
const DEFAULT_LIST_LIMIT = 50

/** Preview length for an owner commit read. Host policy, not a locked number. */
const PREVIEW_LINES = 40

const SKIP = snapshotSkip

export interface HistoryNode {
  id: string
  message: string
  time: string
  parentIds: string[]
}

export interface HistoryTip {
  name: string
  commitId: string
}

/**
 * Commit the app source snapshot. Storage, history metadata, and `node_modules` stay out.
 * A clean tree does not create an empty commit.
 * @param appDir - absolute app directory
 * @param message - required commit message
 */
export async function commitApp(appDir: string, message: string): Promise<FileCommit & { id?: string }> {
  if (message.trim() === '') throw new HistoryError('history-empty-message', 'history commit message is empty')
  await ensureRepo(appDir)
  try {
    const changed = await stage(appDir)
    if (!changed) return { status: 'clean' }
    const id = await git.commit({
      fs,
      dir: appDir,
      message,
      author: AUTHOR,
      committer: AUTHOR,
    })
    return { status: 'committed', id }
  } catch (error) {
    throw new HistoryError('commit-failed', 'history commit failed', { cause: error })
  }
}

/** First and latest commit times on `main`. Both are omitted when the repo has no commit. */
export async function historyBounds(appDir: string): Promise<{ createdAt?: string; updatedAt?: string }> {
  if (!fs.existsSync(path.join(appDir, gitDir))) return {}
  const head = await git.resolveRef({ fs, dir: appDir, ref: 'main' }).catch(() => null)
  if (head === null) return {}
  const latest = await git.readCommit({ fs, dir: appDir, oid: head })
  let created = latest
  let parent = latest.commit.parent[0]
  const seen = new Set<string>([head])
  while (parent !== undefined && !seen.has(parent)) {
    seen.add(parent)
    created = await git.readCommit({ fs, dir: appDir, oid: parent })
    parent = created.commit.parent[0]
  }
  return {
    createdAt: commitTime(created.commit.committer.timestamp),
    updatedAt: commitTime(latest.commit.committer.timestamp),
  }
}

/**
 * List commits on `main` and the backup tips. An empty repo is an empty history.
 * @param appDir - absolute app directory
 * @param limit - caller cap; omitted uses host policy
 */
export async function listHistory(appDir: string, limit = DEFAULT_LIST_LIMIT): Promise<{
  head: string | null
  nodes: HistoryNode[]
  tips: HistoryTip[]
}> {
  if (!fs.existsSync(path.join(appDir, gitDir))) return { head: null, nodes: [], tips: [] }
  const head = await git.resolveRef({ fs, dir: appDir, ref: 'main' }).catch(() => null)
  if (head === null) return { head: null, nodes: [], tips: [] }
  const commits = await git.log({ fs, dir: appDir, ref: 'main', depth: limit })
  const refs = await git.listRefs({ fs, dir: appDir, filepath: 'refs' })
  const tips: HistoryTip[] = []
  for (const name of refs) {
    const commitId = await git.resolveRef({ fs, dir: appDir, ref: name }).catch(() => undefined)
    if (commitId !== undefined) tips.push({ name, commitId })
  }
  return {
    head,
    nodes: commits.map(entry => ({
      id: entry.oid,
      message: entry.commit.message.trim(),
      time: commitTime(entry.commit.committer.timestamp),
      parentIds: entry.commit.parent,
    })),
    tips,
  }
}

/**
 * Make the working tree and `main` match `commitId`. The previous head stays a backup ref.
 * A tree that already matches does not write a backup ref.
 * @param appDir - absolute app directory
 * @param commitId - full commit id, or a ref that resolves to one
 */
export async function resetApp(appDir: string, commitId: string): Promise<{
  head: string
  backupRef?: string
  changed: boolean
  files: string[]
}> {
  await ensureRepo(appDir)
  const target = await resolveCommit(appDir, commitId)
  const previous = await git.resolveRef({ fs, dir: appDir, ref: 'HEAD' }).catch(() => undefined)
  const changedRows = await diffAgainst(appDir, target)
  const headMoves = previous !== undefined && previous !== target
  if (changedRows.length === 0 && !headMoves) {
    return { head: target, changed: false, files: [] }
  }
  let backupRef: string | undefined
  if (previous !== undefined) {
    backupRef = `refs/mini-app/backup/${previous}`
    await git.writeRef({ fs, dir: appDir, ref: backupRef, value: previous, force: true })
  }
  const headFiles = previous === undefined ? [] : await git.listFiles({ fs, dir: appDir, ref: previous })
  const targetFiles = new Set(await git.listFiles({ fs, dir: appDir, ref: target }))
  const files = [...new Set([
    ...changedRows,
    ...headFiles.filter(file => !targetFiles.has(file) && !skipped(file)),
  ])]
  await git.checkout({ fs, dir: appDir, ref: target, force: true })
  return {
    head: target,
    ...backupRef === undefined ? {} : { backupRef },
    changed: true,
    files,
  }
}

/**
 * Owner read of one commit. The preview is not every changed line.
 * @param appDir - absolute app directory
 * @param commitId - full commit id
 */
export async function readAppCommit(appDir: string, commitId: string): Promise<{
  message: string
  time: string
  parentIds: string[]
  files: Array<{ path: string; add: number; del: number; preview: string }>
}> {
  const oid = await resolveCommit(appDir, commitId)
  const commit = await git.readCommit({ fs, dir: appDir, oid })
  const parent = commit.commit.parent[0]
  const current = await git.listFiles({ fs, dir: appDir, ref: oid })
  const previous = parent === undefined ? [] : await git.listFiles({ fs, dir: appDir, ref: parent })
  const paths = [...new Set([...current, ...previous])].filter(file => !skipped(file)).sort()
  const files = []
  for (const file of paths) {
    const after = current.includes(file) ? await blobText(appDir, oid, file) : ''
    const before = parent !== undefined && previous.includes(file) ? await blobText(appDir, parent, file) : ''
    const counted = lineCounts(before, after)
    if (counted.add === 0 && counted.del === 0) continue
    files.push({ path: file, ...counted })
  }
  return {
    message: commit.commit.message.trim(),
    time: new Date(commit.commit.committer.timestamp * 1000).toISOString(),
    parentIds: commit.commit.parent,
    files,
  }
}

async function ensureRepo(appDir: string): Promise<void> {
  if (fs.existsSync(path.join(appDir, gitDir))) return
  await git.init({ fs, dir: appDir, defaultBranch: 'main' })
}

async function stage(appDir: string): Promise<boolean> {
  const head = await git.resolveRef({ fs, dir: appDir, ref: 'HEAD' }).catch(() => undefined)
  const allTracked = head === undefined ? [] : await git.listFiles({ fs, dir: appDir, ref: head })
  const tracked = allTracked.filter(file => !skipped(file))
  const disk = await walk(appDir)
  let changed = false
  for (const file of disk) {
    const current = await readFile(filePath(appDir, file))
    const previous = head === undefined || !tracked.includes(file)
      ? undefined
      : await git.readBlob({ fs, dir: appDir, oid: head, filepath: file })
    if (previous === undefined || !Buffer.from(previous.blob).equals(current)) {
      await git.add({ fs, dir: appDir, filepath: file })
      changed = true
    }
  }
  for (const file of allTracked) {
    if (!skipped(file) && disk.includes(file)) continue
    await git.remove({ fs, dir: appDir, filepath: file })
    changed = true
  }
  return changed
}

async function diffAgainst(appDir: string, oid: string): Promise<string[]> {
  const tracked = (await git.listFiles({ fs, dir: appDir, ref: oid })).filter(file => !skipped(file))
  const disk = new Set(await walk(appDir))
  const files: string[] = []
  for (const file of tracked) {
    if (!disk.has(file)) {
      files.push(file)
      continue
    }
    const blob = await git.readBlob({ fs, dir: appDir, oid, filepath: file })
    const current = await readFile(filePath(appDir, file))
    if (!Buffer.from(blob.blob).equals(current)) files.push(file)
  }
  return files
}

function filePath(appDir: string, file: string): string {
  return path.join(appDir, ...file.split('/'))
}

async function resolveCommit(appDir: string, commitId: string): Promise<string> {
  try {
    return await git.resolveRef({ fs, dir: appDir, ref: commitId })
  } catch (error) {
    throw new HistoryError('history-unknown-commit', `unknown commit: ${commitId}`, { cause: error })
  }
}

async function blobText(appDir: string, oid: string, filepath: string): Promise<string> {
  const blob = await git.readBlob({ fs, dir: appDir, oid, filepath })
  return new TextDecoder().decode(blob.blob)
}

function lineCounts(before: string, after: string): { add: number; del: number; preview: string } {
  const oldLines = before === '' ? [] : before.split('\n')
  const nextLines = after === '' ? [] : after.split('\n')
  const bag = new Map<string, number>()
  for (const line of oldLines) bag.set(line, (bag.get(line) ?? 0) + 1)
  let add = 0
  let del = 0
  const preview: string[] = []
  for (const line of nextLines) {
    const left = bag.get(line) ?? 0
    if (left > 0) bag.set(line, left - 1)
    else {
      add += 1
      if (preview.length < PREVIEW_LINES) preview.push(`+${line}`)
    }
  }
  for (const [line, count] of bag) {
    del += count
    for (let index = 0; index < count && preview.length < PREVIEW_LINES; index += 1) preview.push(`-${line}`)
  }
  return { add, del, preview: preview.join('\n') }
}

function commitTime(seconds: number): string {
  return new Date(seconds * 1000).toISOString()
}

async function walk(dir: string, root = dir): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const files: string[] = []
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) files.push(...await walk(full, root))
    else files.push(path.relative(root, full).split(path.sep).join('/'))
  }
  return files
}

function skipped(filepath: string): boolean {
  return filepath.split('/').some(part => SKIP.has(part))
}
