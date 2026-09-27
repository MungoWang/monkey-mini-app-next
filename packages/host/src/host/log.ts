import { appendFileSync, mkdirSync, readdirSync, readFileSync, renameSync, statSync, unlinkSync } from 'node:fs'
import path from 'node:path'

import { hostLayout } from './layout.ts'

/** Byte cap for one app. Host policy, not a locked number. */
export const DEFAULT_HOST_LOG_BYTES = 5 * 1024 * 1024

/** Sealed piece. A write never reads log bytes. Host policy, not a locked number. */
const SEGMENT_BYTES = 1024 * 1024

const ACTIVE = hostLayout.appLog

export interface HostLog {
  write(appId: string, ...args: unknown[]): void
  read(appId: string): readonly string[]
}

/**
 * Append-only JSONL log at `apps/<appId>/logs`.
 * One record is one line. A record is written whole, even when it is larger than the segment.
 * The active file is sealed before a record would cross the segment size.
 * Past `maxBytes`, the oldest sealed file is deleted. The newest file stays.
 * `write` uses stat, rename, and unlink. It does not read the log.
 * @param runtimeRoot - host runtime root
 * @param maxBytes - cap across the segments of one app
 */
export function createHostLog(runtimeRoot: string, maxBytes = DEFAULT_HOST_LOG_BYTES): HostLog {
  const segmentBytes = Math.min(SEGMENT_BYTES, maxBytes)
  return {
    write(appId, ...args) {
      const dir = logDir(runtimeRoot, appId)
      mkdirSync(dir, { recursive: true })
      const line = jsonLine(args)
      const active = path.join(dir, ACTIVE)
      if (fileSize(active) > 0 && fileSize(active) + Buffer.byteLength(line) > segmentBytes) seal(dir)
      appendFileSync(active, line)
      if (fileSize(active) > segmentBytes) seal(dir)
      dropOldest(dir, maxBytes)
    },
    read(appId) {
      const lines: string[] = []
      for (const name of segmentNames(logDir(runtimeRoot, appId))) {
        let text: string
        try {
          text = readFileSync(path.join(logDir(runtimeRoot, appId), name), 'utf8')
        } catch {
          continue
        }
        lines.push(...recordLines(text))
      }
      return lines
    },
  }
}

function logDir(runtimeRoot: string, appId: string): string {
  if (appId === '' || appId.includes('/') || appId.includes('\\') || appId.includes('..')) {
    throw new Error(`log app id is not a single segment: ${appId}`)
  }
  return path.join(runtimeRoot, hostLayout.apps, appId, hostLayout.logs)
}

function jsonLine(args: unknown[]): string {
  return `${JSON.stringify({ t: new Date().toISOString(), line: args.map(textOf).join(' ') })}\n`
}

function recordLines(text: string): string[] {
  const lines: string[] = []
  for (const row of text.split('\n')) {
    if (row === '') continue
    try {
      const value: unknown = JSON.parse(row)
      if (typeof value === 'object' && value !== null && 'line' in value && typeof value.line === 'string') {
        lines.push(value.line)
        continue
      }
    } catch {
      // A line that is not a record is kept as text.
    }
    lines.push(row)
  }
  return lines
}

function fileSize(file: string): number {
  try {
    return statSync(file).size
  } catch {
    return 0
  }
}

function seal(dir: string): void {
  const active = path.join(dir, ACTIVE)
  if (fileSize(active) === 0) return
  renameSync(active, path.join(dir, `${nextId(dir)}.log`))
}

function nextId(dir: string): string {
  let max = 0
  for (const name of segmentNames(dir)) {
    if (name === ACTIVE) continue
    const id = Number(name.slice(0, -'.log'.length))
    if (Number.isInteger(id) && id > max) max = id
  }
  return String(max + 1).padStart(6, '0')
}

function dropOldest(dir: string, maxBytes: number): void {
  const segments = segmentNames(dir).map(name => ({
    name,
    path: path.join(dir, name),
    size: fileSize(path.join(dir, name)),
  }))
  let total = segments.reduce((sum, item) => sum + item.size, 0)
  for (const item of segments.slice(0, -1)) {
    if (total <= maxBytes) return
    unlinkSync(item.path)
    total -= item.size
  }
}

function segmentNames(dir: string): string[] {
  let names: string[]
  try {
    names = readdirSync(dir)
  } catch {
    return []
  }
  return names.filter(name => name.endsWith('.log')).sort()
}

function textOf(value: unknown): string {
  if (typeof value === 'string') return value
  if (value instanceof Error) return value.message
  try {
    return JSON.stringify(value)
  } catch {
    return Object.prototype.toString.call(value)
  }
}
