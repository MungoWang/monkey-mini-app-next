import { describe, expect, it } from 'vitest'

import { MetricsError, readMetrics } from '../src/index.ts'

describe('readMetrics', () => {
  it('reads one snapshot and does not invent a Windows load average', () => {
    const snapshot = readMetrics(new Date('2026-09-16T00:00:00.000Z'))
    expect(new MetricsError('metrics-unreadable', 'x').code).toBe('metrics-unreadable')
    expect(snapshot.collectedAt).toBe('2026-09-16T00:00:00.000Z')
    expect(snapshot.memory.total).toBeGreaterThan(0)
    expect(snapshot.cpu.count).toBeGreaterThan(0)
    expect(snapshot.memory.usedRatio).toBeGreaterThanOrEqual(0)
    expect(readMetrics(new Date('2026-09-16T00:00:00.000Z'), 'win32').loadavg).toBeNull()
    if (snapshot.platform === 'win32') {
      expect(snapshot.loadavg).toBeNull()
    } else {
      expect(typeof snapshot.loadavg?.['1m']).toBe('number')
      expect(typeof snapshot.loadavg?.['5m']).toBe('number')
      expect(typeof snapshot.loadavg?.['15m']).toBe('number')
    }
  })
})
