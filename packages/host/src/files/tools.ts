import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'

import { appEntries } from '@mini-app/contract'

import { FileToolError } from './codes.ts'
import { snapshotSkip } from './skip.ts'

/** Names listing never returns. The set is `snapshotSkip`. */
const SKIP = snapshotSkip

/** Required entries. One table, not a special case for the manifest. */
const PROTECTED = new Set<string>([appEntries.manifest, appEntries.ui, appEntries.backend])

export interface FileRead {
  path: string
  content: string
  bytes: number
  totalLines: number
  startLine: number
  endLine: number
  truncated?: boolean
}

export interface FileCommit {
  status: 'committed' | 'clean' | 'skipped' | 'failed'
  reason?: string
}

/**
 * Authoring file tools for one app directory. Paths use `/` on every platform.
 * @param appDir - absolute app directory
 * @param options - window cap and the history commit, which is not wired here
 */
export function createFileTools(appDir: string, options?: {
  readonly maxLines?: number
  readonly commit?: (message: string) => Promise<FileCommit>
  /** Another owner decides. This module does not know why a path is kept. */
  readonly protectedPath?: (portablePath: string) => boolean
}) {
  return {
    list: () => listFiles(appDir),
    read: (relative: string, window?: { start?: number; end?: number }, numbered = false) =>
      readAppFile(appDir, relative, window, numbered, options?.maxLines),
    edit: (relative: string, edits: Array<{ oldText: string; newText: string }>, commit = true) =>
      editAppFile(appDir, relative, edits, commit, options?.commit, options?.protectedPath),
    write: (relative: string, content: string, commit = true) =>
      writeAppFile(appDir, relative, content, commit, options?.commit, options?.protectedPath),
    delete: (relative: string, commit = true) =>
      deleteAppFile(appDir, relative, commit, options?.commit, options?.protectedPath),
  }
}

/** Reject an absolute path or `..` on both POSIX and Windows, whatever the host is. */
export function resolveAppPath(appDir: string, relative: string): string {
  if (relative === '' || isAbsolute(relative) || relative.split(/[\\/]/).includes('..')) {
    throw new FileToolError('path-escape', `path escapes the app directory: ${relative}`)
  }
  const resolved = path.resolve(appDir, relative)
  const stayed = path.relative(appDir, resolved)
  if (stayed.startsWith('..') || path.isAbsolute(stayed)) {
    throw new FileToolError('path-escape', `path escapes the app directory: ${relative}`)
  }
  return resolved
}

function isAbsolute(value: string): boolean {
  return path.posix.isAbsolute(value) || path.win32.isAbsolute(value)
}

async function listFiles(appDir: string): Promise<Array<{ path: string; bytes: number }>> {
  const out: Array<{ path: string; bytes: number }> = []
  await walk(appDir, appDir, out)
  return out
}

async function walk(appDir: string, current: string, out: Array<{ path: string; bytes: number }>): Promise<void> {
  const entries = await readdir(current, { withFileTypes: true })
  for (const entry of entries) {
    if (SKIP.has(entry.name)) continue
    const full = path.join(current, entry.name)
    if (entry.isDirectory()) {
      await walk(appDir, full, out)
      continue
    }
    if (!entry.isFile()) continue
    const info = await stat(full)
    out.push({ path: path.relative(appDir, full).split(path.sep).join('/'), bytes: info.size })
  }
}

async function readAppFile(
  appDir: string,
  relative: string,
  window: { start?: number; end?: number } | undefined,
  numbered: boolean,
  maxLines: number | undefined,
): Promise<FileRead> {
  const full = resolveAppPath(appDir, relative)
  const info = await stat(full).catch(() => undefined)
  if (info === undefined) throw new FileToolError('file-missing', `file is missing: ${relative}`)
  if (info.isDirectory()) throw new FileToolError('path-is-directory', `path is a directory: ${relative}`)
  const text = await readFile(full, 'utf8')
  const lines = text.split(/\r?\n/)
  const totalLines = lines.length
  const start = window?.start ?? 1
  const requestedEnd = window?.end ?? totalLines
  const cappedEnd = maxLines === undefined ? requestedEnd : Math.min(requestedEnd, start + maxLines - 1)
  const end = Math.min(cappedEnd, totalLines)
  const slice = lines.slice(Math.max(0, start - 1), end)
  const content = numbered
    ? slice.map((line, index) => `${start + index}|${line}`).join('\n')
    : slice.join('\n')
  const truncated = end < requestedEnd || end < totalLines && window?.end === undefined && maxLines !== undefined
  return {
    path: relative.split(/[\\/]/).join('/'),
    content,
    bytes: info.size,
    totalLines,
    startLine: start,
    endLine: end,
    ...truncated ? { truncated: true } : {},
  }
}

async function editAppFile(
  appDir: string,
  relative: string,
  edits: Array<{ oldText: string; newText: string }>,
  commit: boolean,
  committer: ((message: string) => Promise<FileCommit>) | undefined,
  protectedPath: ((portablePath: string) => boolean) | undefined,
): Promise<{ path: string; commit: FileCommit }> {
  rejectOwned(relative, protectedPath)
  const full = resolveAppPath(appDir, relative)
  let text: string
  try {
    text = await readFile(full, 'utf8')
  } catch {
    throw new FileToolError('file-missing', `file is missing: ${relative}`)
  }
  for (const edit of edits) {
    const at = text.indexOf(edit.oldText)
    if (at < 0 || text.indexOf(edit.oldText, at + 1) >= 0) {
      throw new FileToolError('edit-not-unique', 'oldText is missing or appears more than once')
    }
    text = `${text.slice(0, at)}${edit.newText}${text.slice(at + edit.oldText.length)}`
  }
  await writeFile(full, text)
  return { path: relative.split(/[\\/]/).join('/'), commit: await finishCommit(commit, committer, `edit ${relative}`) }
}

async function writeAppFile(
  appDir: string,
  relative: string,
  content: string,
  commit: boolean,
  committer: ((message: string) => Promise<FileCommit>) | undefined,
  protectedPath: ((portablePath: string) => boolean) | undefined,
): Promise<{ path: string; commit: FileCommit }> {
  rejectOwned(relative, protectedPath)
  const full = resolveAppPath(appDir, relative)
  const info = await stat(full).catch(() => undefined)
  if (info?.isDirectory()) throw new FileToolError('path-is-directory', `path is a directory: ${relative}`)
  await mkdir(path.dirname(full), { recursive: true })
  await writeFile(full, content)
  return { path: relative.split(/[\\/]/).join('/'), commit: await finishCommit(commit, committer, `write ${relative}`) }
}

async function deleteAppFile(
  appDir: string,
  relative: string,
  commit: boolean,
  committer: ((message: string) => Promise<FileCommit>) | undefined,
  protectedPath: ((portablePath: string) => boolean) | undefined,
): Promise<{ path: string; commit: FileCommit }> {
  rejectProtected(relative, protectedPath)
  const full = resolveAppPath(appDir, relative)
  try {
    await rm(full)
  } catch {
    throw new FileToolError('file-missing', `file is missing: ${relative}`)
  }
  return { path: relative.split(/[\\/]/).join('/'), commit: await finishCommit(commit, committer, `delete ${relative}`) }
}

function rejectOwned(
  relative: string,
  protectedPath: ((portablePath: string) => boolean) | undefined,
): void {
  const portable = relative.split(/[\/]/).join('/')
  if (protectedPath?.(portable) === true) {
    throw new FileToolError('manifest-protected', `required entry cannot be changed: ${portable}`)
  }
}

function rejectProtected(
  relative: string,
  protectedPath: ((portablePath: string) => boolean) | undefined,
): void {
  const portable = relative.split(/[\/]/).join('/')
  if (PROTECTED.has(portable) || protectedPath?.(portable) === true) {
    throw new FileToolError('manifest-protected', `required entry cannot be changed: ${portable}`)
  }
}

async function finishCommit(
  commit: boolean,
  committer: ((message: string) => Promise<FileCommit>) | undefined,
  message: string,
): Promise<FileCommit> {
  if (!commit) return { status: 'skipped' }
  if (committer === undefined) return { status: 'failed', reason: 'history is not wired' }
  return committer(message)
}
