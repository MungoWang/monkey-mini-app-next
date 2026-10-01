import { arch, cpus, freemem, hostname, loadavg, platform, totalmem, uptime } from 'node:os'

import type { AppSystemMetrics } from '@mohou/contract'

import { MetricsError } from './codes.ts'

/**
 * Read one OS snapshot. Windows does not provide a load average, so that field is null.
 * A missing CPU list or a zero memory total throws. Zeros are not filled in.
 */
function readLoadavg(osPlatform: NodeJS.Platform): AppSystemMetrics['loadavg'] {
  if (osPlatform === 'win32') return null
  const load = loadavg()
  const one = load[0]
  const five = load[1]
  const fifteen = load[2]
  if (one === undefined || five === undefined || fifteen === undefined) {
    throw new MetricsError('metrics-unreadable', 'load average is unreadable')
  }
  return { '1m': one, '5m': five, '15m': fifteen }
}

export function readMetrics(now: Date = new Date(), osPlatform: NodeJS.Platform = platform()): AppSystemMetrics {
  try {
    const cpu = cpus()
    const first = cpu[0]
    const total = totalmem()
    if (first === undefined || total === 0) {
      throw new MetricsError('metrics-unreadable', 'OS snapshot is unreadable')
    }
    const free = freemem()
    const used = total - free
    const load = readLoadavg(osPlatform)
    return {
      platform: platform(),
      arch: arch(),
      hostname: hostname(),
      uptimeSec: uptime(),
      loadavg: load,
      memory: { total, free, used, usedRatio: used / total },
      cpu: { count: cpu.length, model: first.model, speedMHz: first.speed },
      collectedAt: now.toISOString(),
    }
  } catch (error) {
    if (error instanceof MetricsError) throw error
    throw new MetricsError('metrics-unreadable', 'OS snapshot is unreadable', { cause: error })
  }
}
