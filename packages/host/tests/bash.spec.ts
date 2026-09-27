import { describe, expect, it } from 'vitest'

import { BashError, createBash, scrubBashEnv, stopChild, type BashPolicy } from '../src/index.ts'

const policy: BashPolicy = { timeoutMs: 2000, maxOutputBytes: 1_000_000 }

describe('createBash', () => {
  it('returns stdout and a non-zero exit without throwing', async () => {
    const bash = createBash(policy)
    const ok = await bash.run('printf hi')
    expect(ok).toEqual({ stdout: 'hi', stderr: '', exitCode: 0 })
    const failed = await bash.run('exit 3')
    expect(failed.exitCode).toBe(3)
    await bash.dispose()
  })

  it('drops credential-shaped environment entries', () => {
    const env = scrubBashEnv({ PATH: '/bin', AWS_SECRET_ACCESS_KEY: 'x', Token: 'y', HOME: '/tmp' })
    expect(env.PATH).toBe('/bin')
    expect(env.HOME).toBe('/tmp')
    expect(env.AWS_SECRET_ACCESS_KEY).toBeUndefined()
    expect(env.Token).toBeUndefined()
  })

  it('emits bash-unavailable when the shell is missing', async () => {
    const bash = createBash(policy, undefined, 'mma-missing-bash')
    await expect(bash.run('printf hi')).rejects.toBeInstanceOf(BashError)
    await expect(bash.run('printf hi')).rejects.toMatchObject({ code: 'bash-unavailable' })
    await bash.dispose()
  })

  it('stops a long command and a huge stream without a failure code', async () => {
    const tight = createBash({ timeoutMs: 50, maxOutputBytes: 8 })
    const timed = await tight.run('sleep 5')
    expect(timed.exitCode).not.toBe(0)
    const capped = await tight.run('dd if=/dev/zero bs=64')
    expect(capped.exitCode).not.toBe(0)
    expect(Buffer.byteLength(capped.stdout)).toBeLessThanOrEqual(8)
    await tight.dispose()
  })

  it('stops a Windows tree without a POSIX signal', () => {
    let killed = 0
    const child = { exitCode: null, signalCode: null, pid: 4, kill() { killed += 1 } }
    stopChild(child as never, 'win32', () => {
      killed += 1
    })
    stopChild({ ...child, pid: undefined } as never, 'win32', () => undefined)
    stopChild({ ...child, exitCode: 0 } as never, 'linux', () => undefined)
    expect(killed).toBe(1)
  })

  it('kills the child when the process group signal fails', () => {
    let killed = 0
    stopChild({
      exitCode: null,
      signalCode: null,
      pid: 2_147_000_000,
      kill() { killed += 1 },
    } as never, 'linux')
    expect(killed).toBe(1)
  })
})
