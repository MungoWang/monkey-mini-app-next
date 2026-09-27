import { describe, expect, it } from 'vitest'

import { modelStream } from '../src/kernel/model-stream.ts'

describe('modelStream', () => {
  it('returns the final string from await without reading, and starts once', async () => {
    let starts = 0
    const stream = modelStream<string>((emit) => {
      starts += 1
      emit('x')
      return Promise.resolve('final')
    })
    await expect(stream).resolves.toBe('final')
    await expect(stream).resolves.toBe('final')
    expect(starts).toBe(1)
  })

  it('queues a chunk that arrives first and delivers a chunk that finds a waiter', async () => {
    let emit: (event: string) => void = () => undefined
    let finish: (value: string) => void = () => undefined
    const stream = modelStream<string>(push => new Promise((resolve) => {
      emit = push
      finish = resolve
    }))
    const iterator = stream[Symbol.asyncIterator]()
    emit('queued')
    await expect(iterator.next()).resolves.toEqual({ value: 'queued', done: false })
    const waiting = iterator.next()
    emit('direct')
    await expect(waiting).resolves.toEqual({ value: 'direct', done: false })
    finish('all')
    await expect(iterator.next()).resolves.toEqual({ value: undefined, done: true })
    await expect(stream).resolves.toBe('all')
  })

  it('rejects iteration and the final string when the model call fails', async () => {
    let fail: (error: Error) => void = () => undefined
    const stream = modelStream<string>(() => new Promise((_resolve, reject) => {
      fail = reject
    }))
    const iterator = stream[Symbol.asyncIterator]()
    const waiting = iterator.next()
    fail(new Error('boom'))
    await expect(waiting).rejects.toThrow('boom')
    await expect(iterator.next()).rejects.toThrow('boom')
    await expect(stream).rejects.toThrow('boom')
  })
})
