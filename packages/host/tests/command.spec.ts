import { describe, expect, it } from 'vitest'

import { createCommand, stopChild } from '../src/shell/command.ts'

const policy = { timeoutMs: 2000, maxOutputBytes: 64 }
const missing = () => new Error('missing')

describe('createCommand', () => {
  it('stops before spawn when the call is already aborted', async () => {
    const command = createCommand(policy, AbortSignal.abort(), () => [process.execPath, '-e', 'process.exit(0)'], missing)
    expect(await command.run('x')).toEqual({ stdout: '', stderr: '', exitCode: 124 })
    await command.dispose()
  })

  it('throws when the executable is missing from argv', async () => {
    const command = createCommand(policy, undefined, () => [], missing)
    await expect(command.run('x')).rejects.toThrow('missing')
    await command.dispose()
  })

  it('rejects a spawn error that is not a missing executable', async () => {
    const command = createCommand(policy, undefined, () => ['/usr'], missing)
    await expect(command.run('x')).rejects.toThrow()
    await command.dispose()
  })

  it('stops a stream that crosses the cap and a child that is still running', async () => {
    const tight = createCommand({ timeoutMs: 2000, maxOutputBytes: 4 }, undefined, (command) => {
      const script = command === 'err'
        ? 'process.stderr.write("abcd"); setTimeout(() => process.stderr.write("efgh"), 40); setTimeout(() => process.exit(0), 80)'
        : 'process.stdout.write("abcdefghij")'
      return [process.execPath, '-e', script]
    }, missing)
    const capped = await tight.run('out')
    expect(Buffer.byteLength(capped.stdout)).toBeLessThanOrEqual(4)
    const erred = await tight.run('err')
    expect(Buffer.byteLength(erred.stderr)).toBeLessThanOrEqual(4)
    await tight.dispose()

    const running = createCommand({ timeoutMs: 5000, maxOutputBytes: 64 }, undefined, () => ['sleep', '5'], missing)
    const pending = running.run('sleep')
    await running.dispose()
    expect((await pending).exitCode).not.toBe(0)
  })

  it('returns when the child was already signalled', () => {
    stopChild({ exitCode: null, signalCode: 'SIGTERM', pid: 4, kill() { return true } } as never, 'linux')
  })
})
