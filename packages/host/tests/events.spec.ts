import { afterEach, describe, expect, it, vi } from 'vitest'

import { bindAppHooks, createAppEvents, forwardFrames } from '../src/index.ts'

afterEach(() => {
  vi.useRealTimers()
})

describe('createAppEvents', () => {
  it('keeps apps apart and replays the retained tail', () => {
    const warnings: string[] = []
    const events = createAppEvents({ tailLength: 2, log: (message) => {
      warnings.push(message)
    } })
    const seen: string[] = []
    events.push('com.example.a', 'tick', { n: 1 })
    events.push('com.example.b', 'tick', { n: 9 })
    const stop = events.subscribe('com.example.a', 0, (item) => {
      if ('seq' in item) seen.push(`${item.name}:${String(item.seq)}`)
    })
    events.push('com.example.a', 'tick', { n: 2 })
    stop()
    events.push('com.example.a', 'tick', { n: 3 })
    expect(seen).toEqual(['tick:1', 'tick:2'])
    events.push('com.example.a', 'bad', () => undefined)
    expect(warnings).toEqual(['ctx.push("bad") dropped: data is not JSON'])
  })

  it('returns the retained tail without opening a subscriber', () => {
    const events = createAppEvents({ tailLength: 2, pingMs: 0 })
    expect(events.retained()).toEqual([])
    events.push('com.example.a', 'tick', 1)
    expect(events.retained()).toEqual([{
      appId: 'com.example.a',
      events: [{ name: 'tick', data: 1, seq: 1 }],
    }])
    events.push('com.example.a', 'tick', 2)
    events.push('com.example.a', 'tick', 3)
    expect(events.retained()).toEqual([{
      appId: 'com.example.a',
      gap: { since: 0 },
      events: [
        { name: 'tick', data: 2, seq: 2 },
        { name: 'tick', data: 3, seq: 3 },
      ],
    }])
  })

  it('reports a gap when the cursor is older than the tail', () => {
    const events = createAppEvents({ tailLength: 1 })
    events.push('com.example.a', 'tick', 1)
    events.push('com.example.a', 'tick', 2)
    const seen: Array<string | number> = []
    events.subscribe('com.example.a', 0, (item) => {
      if ('type' in item && item.type === 'app:gap') seen.push(item.since)
      if ('seq' in item) seen.push(item.seq)
    })
    expect(seen).toEqual([0, 2])
  })

  it('sends a retry hint on open and pings only while someone is listening', () => {
    vi.useFakeTimers()
    const events = createAppEvents({ tailLength: 2, pingMs: 1000, retryMs: 250 })
    const seen: string[] = []
    const stop = events.subscribe('com.example.a', 0, (item) => {
      if ('type' in item) seen.push(item.type === 'retry' ? `retry:${item.retryMs}` : item.type)
    })
    vi.advanceTimersByTime(1000)
    stop()
    vi.advanceTimersByTime(1000)
    expect(seen).toEqual(['retry:250', 'ping'])
    const again: string[] = []
    events.subscribe('com.example.a', 0, (item) => {
      if ('type' in item && item.type === 'retry') again.push('retry')
    })
    expect(again).toEqual(['retry'])
  })

  it('maps channels and surfaces a gap only on onAny', () => {
    const events = createAppEvents({ tailLength: 1, pingMs: 0 })
    events.push('com.example.a', 'tick', { n: 1 })
    events.push('com.example.a', 'tick', { n: 2 })
    const channels: unknown[] = []
    const any: Array<{ name: string; data: unknown }> = []
    const stopOn = bindAppHooks(events, 'com.example.a').on('tick', (data) => {
      channels.push(data)
    })
    const stopAny = bindAppHooks(events, 'com.example.a', 0).onAny((event) => {
      any.push(event)
    })
    const stopStar = bindAppHooks(events, 'com.example.a', 99).on('*', (data) => {
      channels.push(data)
    })
    events.push('com.example.a', 'other', { n: 3 })
    stopOn()
    stopAny()
    stopStar()
    events.push('com.example.a', 'tick', { n: 4 })
    expect(channels).toEqual([{ n: 2 }, { n: 3 }])
    expect(any).toEqual([
      { name: '*', data: { gap: true } },
      { name: 'tick', data: { n: 2 } },
      { name: 'other', data: { n: 3 } },
    ])
  })
})

describe('forwardFrames', () => {
  it('copies the retained tail and then live pushes, once', () => {
    const events = createAppEvents({ tailLength: 2, pingMs: 0 })
    events.push('com.example.a', 'tick', { n: 1 })
    events.push('com.example.a', 'tick', { n: 2 })
    const seen: unknown[] = []
    const stop = forwardFrames(events, (event) => {
      seen.push(event)
    })
    events.push('com.example.b', 'other', { n: 3 })
    stop()
    events.push('com.example.a', 'tick', { n: 4 })
    expect(seen).toEqual([
      { type: 'app:event', appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 },
      { type: 'app:event', appId: 'com.example.a', name: 'tick', data: { n: 2 }, seq: 2 },
      { type: 'app:event', appId: 'com.example.b', name: 'other', data: { n: 3 }, seq: 1 },
    ])
  })
})
