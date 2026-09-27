import { type ChildProcess, spawn } from 'node:child_process'

/** Injected bounds. The numbers are host policy and are not locked here. */
export interface CommandPolicy {
  readonly timeoutMs: number
  readonly maxOutputBytes: number
}

/** One command result. A non-zero exit is not a failure code. */
export interface CommandResult {
  stdout: string
  stderr: string
  exitCode: number
}

/** A live shell binding. `dispose` waits until every child has exited. */
export interface CommandHandle {
  run(command: string): Promise<CommandResult>
  dispose(): Promise<void>
}

/** Result used when host policy stops the child. Not a failure code. */
const STOPPED = 124

/** Drop credential-shaped names. Match is case-insensitive. */
const SENSITIVE_ENV = /KEY|SECRET|TOKEN|PASSWORD/i

/** Parent environment minus key, secret, token, and password entries. */
export function scrubShellEnv(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  const next: Record<string, string> = {}
  for (const [key, value] of Object.entries(env)) {
    if (value !== undefined && !SENSITIVE_ENV.test(key)) next[key] = value
  }
  return next
}

/**
 * Spawn one command. `argv` is the full executable plus arguments.
 * Stopping a child uses `kill()` with no signal so Windows can terminate it.
 * @param policy - resolved host bounds
 * @param callSignal - aborting it stops the child
 * @param argv - executable and arguments for this command
 * @param unavailable - error when the executable is missing
 */
export function createCommand(
  policy: CommandPolicy,
  callSignal: AbortSignal | undefined,
  argv: (command: string) => string[],
  unavailable: () => Error,
): CommandHandle {
  const children = new Set<ChildProcess>()
  return {
    run: command => run(policy, callSignal, argv(command), children, unavailable),
    dispose: () => dispose(children),
  }
}

async function run(
  policy: CommandPolicy,
  callSignal: AbortSignal | undefined,
  argv: string[],
  children: Set<ChildProcess>,
  unavailable: () => Error,
): Promise<CommandResult> {
  if (callSignal?.aborted) return { stdout: '', stderr: '', exitCode: STOPPED }
  const [executable, ...args] = argv
  if (executable === undefined) throw unavailable()
  const child = spawn(executable, args, {
    env: scrubShellEnv(),
    stdio: ['ignore', 'pipe', 'pipe'],
    // A new process group on POSIX so stop() can signal descendants. Windows uses taskkill /T.
    detached: process.platform !== 'win32',
  })
  children.add(child)
  const stdout = collect(child.stdout, policy.maxOutputBytes, () => {
    stop(child)
  })
  const stderr = collect(child.stderr, policy.maxOutputBytes, () => {
    stop(child)
  })
  const timer = setTimeout(() => {
    stop(child)
  }, policy.timeoutMs)
  const onAbort = () => {
    stop(child)
  }
  callSignal?.addEventListener('abort', onAbort, { once: true })
  try {
    const exitCode = await exited(child, unavailable)
    return {
      stdout: await stdout,
      stderr: await stderr,
      exitCode: exitCode ?? STOPPED,
    }
  } finally {
    clearTimeout(timer)
    callSignal?.removeEventListener('abort', onAbort)
    children.delete(child)
  }
}

function collect(stream: NodeJS.ReadableStream | null, maxBytes: number, onCap: () => void): Promise<string> {
  if (stream === null) return Promise.resolve('')
  const chunks: Buffer[] = []
  let total = 0
  return new Promise((resolve) => {
    stream.on('data', (chunk: Buffer) => {
      const remaining = maxBytes - total
      if (remaining <= 0) {
        onCap()
        return
      }
      const slice = chunk.subarray(0, remaining)
      chunks.push(slice)
      total += slice.byteLength
      if (chunk.byteLength > remaining) onCap()
    })
    stream.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
    stream.on('error', () => {
      resolve(Buffer.concat(chunks).toString('utf8'))
    })
  })
}

export function stopChild(
  child: ChildProcess,
  platform = process.platform,
  killTree: (pid: number) => void = (pid) => {
    spawn('taskkill', ['/PID', String(pid), '/T', '/F'], { stdio: 'ignore' })
  },
): void {
  if (child.exitCode !== null || child.signalCode !== null) return
  const pid = child.pid
  if (pid === undefined) return
  if (platform === 'win32') {
    killTree(pid)
    return
  }
  try {
    process.kill(-pid, 'SIGTERM')
  } catch {
    child.kill()
  }
}

function stop(child: ChildProcess): void {
  stopChild(child)
}

function exited(child: ChildProcess, unavailable: () => Error): Promise<number | null> {
  if (child.exitCode !== null) return Promise.resolve(child.exitCode)
  return new Promise((resolve, reject) => {
    child.once('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'ENOENT') {
        reject(unavailable())
        return
      }
      reject(error)
    })
    child.once('exit', (code) => {
      resolve(code)
    })
  })
}

async function dispose(children: Set<ChildProcess>): Promise<void> {
  const pending = [...children]
  for (const child of pending) stop(child)
  await Promise.all(pending.map(child => exited(child, () => new Error('shell is not available')).catch(() => null)))
}
