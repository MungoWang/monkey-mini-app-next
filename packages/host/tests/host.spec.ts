import { describe, expect, it } from 'vitest'

import type { AppAgentEvent } from '@mohou/contract'
import { createEchoProvider, type RuntimeProvider } from '@mohou/runtime-provider'

import { HostError, bindBrain, resolveWorkingDirectory } from '../src/index.ts'

const dirs = {
  appDir: '/apps/com.example.app',
  processDirectory: '/proc',
  createTemp: () => '/tmp/run',
}

describe('resolveWorkingDirectory', () => {
  it('defaults to the process directory and treats a bare path as custom', () => {
    expect(resolveWorkingDirectory(dirs)).toBe('/proc')
    expect(resolveWorkingDirectory({ ...dirs, cwd: '/work' })).toBe('/work')
    expect(resolveWorkingDirectory({ ...dirs, cwdType: 'app' })).toBe('/apps/com.example.app')
    expect(resolveWorkingDirectory({ ...dirs, cwdType: 'temp' })).toBe('/tmp/run')
  })

  it('rejects a path with another mode and a relative custom path', () => {
    expect(() => resolveWorkingDirectory({ ...dirs, cwdType: 'app', cwd: '/work' })).toThrow(HostError)
    expect(() => resolveWorkingDirectory({ ...dirs, cwdType: 'custom', cwd: 'relative' })).toThrow(HostError)
  })
})

describe('bindBrain', () => {
  it('routes echo and keeps going when the observer throws', async () => {
    const brain = await bindBrain({
      provider: createEchoProvider(),
      appDir: dirs.appDir,
      processDirectory: dirs.processDirectory,
      createTemp: dirs.createTemp,
      push: () => undefined,
    })
    expect(await brain.llm('hello')).toBe('hello')
    expect(await brain.llm('hello', {
      stream: true,
      onEvent() {
        throw new Error('observer')
      },
    })).toBe('hello')
    expect(await brain.agent('goal', {
      onEvent() {
        throw new Error('observer')
      },
    })).toBe('goal')
    await brain.stop()
  })

  it('does not stop the shared provider when the call ends', async () => {
    const provider = createEchoProvider()
    const brain = await bindBrain({
      provider,
      appDir: dirs.appDir,
      processDirectory: dirs.processDirectory,
      createTemp: dirs.createTemp,
      push: () => undefined,
    })
    await brain.stop()
    expect(provider.healthy()).toBe(true)
  })

  it('stops the run after the caller maxIterations', async () => {
    const provider: RuntimeProvider = {
      id: 'turns',
      start: () => Promise.resolve(),
      stop: () => Promise.resolve(),
      healthy: () => true,
      llm: prompt => Promise.resolve(prompt),
      agent: (_goal, options) => {
        const end = (turn: number): AppAgentEvent => ({ type: 'turn', phase: 'end', turn })
        options?.onEvent?.(end(1))
        options?.onEvent?.(end(2))
        return Promise.resolve('done')
      },
    }
    const brain = await bindBrain({
      provider,
      ...dirs,
      push: () => undefined,
    })
    let seen: AbortSignal | undefined
    provider.agent = (_goal, options) => {
      seen = options?.signal
      options?.onEvent?.({ type: 'turn', phase: 'end', turn: 1 })
      return Promise.resolve('done')
    }
    await brain.agent('goal', { maxIterations: 1 })
    expect(seen?.aborted).toBe(true)
  })
})
