import { defineApp } from '@mohou/contract'

import { runRefresh } from './api/scan'
import { type Payload, type Progress } from './shared/events'
import { SAMPLE_ITEMS } from './shared/sample'

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPayload(value: unknown): value is Payload {
  if (!isRecord(value) || !Array.isArray(value.items) || typeof value.at !== 'number') return false
  if (value.digest === null) return true
  return isRecord(value.digest) && typeof value.digest.headline === 'string' && Array.isArray(value.digest.bullets)
}

function isProgress(value: unknown): value is Progress {
  return isRecord(value)
    && typeof value.running === 'boolean'
    && typeof value.step === 'string'
    && typeof value.done === 'number'
    && typeof value.total === 'number'
}

export default defineApp({
  name: '信息雷达',
  description: '拉源、做简报、长任务可取消',
  api: {
    async latest(ctx): Promise<Payload> {
      const stored = await ctx.storage.kv().get('latest')
      if (isPayload(stored)) return stored
      return { items: SAMPLE_ITEMS, digest: null, at: 0 }
    },

    // fire-and-forget: returns immediately; api/scan.ts pushes progress over SSE
    scan(ctx) {
      void runRefresh(ctx)
      return { ok: true }
    },

    async scanStatus(ctx): Promise<Progress> {
      const stored = await ctx.storage.kv().get('progress')
      if (isProgress(stored)) return stored
      return { running: false, step: 'idle', done: 0, total: 3 }
    },

    async refresh(ctx) {
      return runRefresh(ctx)
    },
  },
})
