import { describe, expect, it, vi } from 'vitest'

vi.mock('node:os', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:os')>()
  return {
    ...actual,
    cpus: () => [],
    totalmem: () => 0,
    loadavg: () => [1, undefined, 3],
  }
})

describe('readMetrics failures', () => {
  it('throws when the OS snapshot is empty', async () => {
    const { MetricsError, readMetrics } = await import('../src/index.ts')
    expect(() => readMetrics(new Date('2026-09-16T00:00:00.000Z'))).toThrow(MetricsError)
    expect(() => readMetrics(new Date('2026-09-16T00:00:00.000Z'), 'linux')).toThrow(MetricsError)
  })
})
