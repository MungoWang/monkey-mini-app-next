import type { ChildProcess } from 'node:child_process'
import { once } from 'node:events'

/** The window child fields the drain uses. A real `ChildProcess` satisfies this. */
export interface DrainChild {
  exitCode: number | null
  signalCode: NodeJS.Signals | null
  kill(signal?: NodeJS.Signals | number): boolean
  once(event: 'exit', listener: (code: number | null) => void): unknown
}

export interface HostDrain {
  /** Dispose the live host, then exit. */
  dispose(): Promise<void>
  /** Window process. Killed when a signal arrives first. */
  child: DrainChild
  exit(code: number): void
}

/**
 * Dispose the live host when the window exits or the process is signalled.
 * A second call does not dispose twice. `SIGINT` is Ctrl-C.
 * @param drain - live host, window child, and the process exit
 * @param signals - defaults to this process
 */
export function bindHostDrain(drain: HostDrain, signals: NodeJS.EventEmitter = process): void {
  let draining = false
  const finish = (code: number) => {
    if (draining) return
    draining = true
    if (drain.child.exitCode === null && drain.child.signalCode === null) drain.child.kill()
    void drain.dispose().then(() => drain.exit(code), () => drain.exit(code))
  }
  signals.once('SIGINT', () => finish(130))
  signals.once('SIGTERM', () => finish(143))
  drain.child.once('exit', (code: number | null) => finish(code ?? 0))
}

/** Resolves when `child` emits `exit`. Tests use this to wait out a spawned entry. */
export function childExited(child: ChildProcess): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode)
  return new Promise((resolve) => {
    once(child, 'exit').then(([code]) => resolve(code as number | null)).catch(() => resolve(null))
  })
}
