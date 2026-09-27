import { describe, expect, it } from 'vitest'

import { createFrameBus } from '../src/frame-bus.ts'

describe('createFrameBus', () => {
  it('holds a push until the iframe is mounted, and does not repeat it', () => {
    const sent: unknown[] = []
    const mounted = new Set<string>()
    const bus = createFrameBus((appId, message) => {
      if (!mounted.has(appId)) return false
      sent.push(message)
      return true
    })
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 })
    expect(sent).toEqual([])
    mounted.add('com.example.a')
    bus.sync(mounted)
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 })
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 2 }, seq: 2 })
    expect(sent).toEqual([
      { appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 },
      { appId: 'com.example.a', name: 'tick', data: { n: 2 }, seq: 2 },
    ])
    mounted.delete('com.example.a')
    bus.sync(mounted)
    mounted.add('com.example.a')
    bus.sync(mounted)
    expect(sent).toHaveLength(4)
  })

  it('sorts out-of-order seq, trims the tail, and stops flush when post fails', () => {
    const sent: unknown[] = []
    let accept = true
    const bus = createFrameBus((_appId, message) => {
      if (!accept) return false
      sent.push(message)
      return true
    })
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 2 }, seq: 2 })
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 })
    bus.sync(new Set(['com.example.a']))
    expect(sent).toEqual([
      { appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 },
      { appId: 'com.example.a', name: 'tick', data: { n: 2 }, seq: 2 },
    ])
    accept = false
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 3 }, seq: 3 })
    expect(sent).toHaveLength(2)
    accept = true
    bus.sync(new Set(['com.example.a']))
    expect(sent).toContainEqual({ appId: 'com.example.a', name: 'tick', data: { n: 3 }, seq: 3 })
    for (let seq = 4; seq <= 60; seq += 1) {
      bus.push({ appId: 'com.example.a', name: 'tick', data: { n: seq }, seq })
    }
    const last = sent.at(-1) as { seq: number }
    expect(last.seq).toBe(60)
  })

  it('delivers a gap once the iframe is mounted, and drops the retained tail', () => {
    const sent: unknown[] = []
    const mounted = new Set<string>()
    let accept = true
    const bus = createFrameBus((appId, message) => {
      if (!mounted.has(appId) || !accept) return false
      sent.push(message)
      return true
    })
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 1 }, seq: 1 })
    bus.gap('com.example.a', 4)
    expect(sent).toEqual([])
    mounted.add('com.example.a')
    bus.sync(mounted)
    expect(sent).toEqual([{ appId: 'com.example.a', type: 'app:gap', since: 4 }])
    bus.push({ appId: 'com.example.a', name: 'tick', data: { n: 5 }, seq: 5 })
    expect(sent).toContainEqual({ appId: 'com.example.a', name: 'tick', data: { n: 5 }, seq: 5 })
    expect(sent.some(item => typeof item === 'object' && item !== null && 'seq' in item && (item as { seq: number }).seq === 1)).toBe(false)
    accept = false
    bus.gap('com.example.a', 9)
    expect(sent).toHaveLength(2)
    accept = true
    bus.sync(mounted)
    expect(sent).toContainEqual({ appId: 'com.example.a', type: 'app:gap', since: 9 })
  })
})
