import { defineApp } from '@mini-app/contract'

import { EV, type Run, type Step } from './shared/events'

// ⭐ key: ctx.agent is the entry point for "have the model do one multi-step job".
//         stream: true is a pull stream inside this method. yield is what streamCall receives.
//         Lifecycle snapshots still use ctx.push so a reopen can paint the last run.
//         Cancellation: a module-level AbortController (the app module loads once, so a var can hold it).

const EMPTY: Run = { goal: '', status: 'idle', steps: [], result: '', startedAt: 0 }

let currentAbort: AbortController | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRun(value: unknown): value is Run {
  return isRecord(value)
    && typeof value.goal === 'string'
    && typeof value.status === 'string'
    && Array.isArray(value.steps)
    && typeof value.result === 'string'
    && typeof value.startedAt === 'number'
}

async function load(ctx): Promise<Run> {
  const stored = await ctx.storage.kv().get('run')
  return isRun(stored) ? stored : EMPTY
}

/** Persist + stream one change. Storage is the snapshot, `push` is the live feed. */
async function save(ctx, run: Run, patch?: Partial<Run>) {
  const next: Run = { ...run, ...(patch || {}) }
  await ctx.storage.kv().set('run', next)
  ctx.push(EV.run, next)
  return next
}

export default defineApp({
  name: '执行器',
  description: '模型自己走多步，UI 就是这条 run，可取消',
  api: {
    /** Snapshot for first paint: fetch once on mount, then live-update from events. */
    async runStatus(ctx) {
      return load(ctx)
    },

    async *start(ctx, args?: { goal?: string }) {
      const goal = (args?.goal ?? '').trim()
      if (!goal) throw new Error('请输入目标')
      currentAbort?.abort()
      const ac = new AbortController()
      currentAbort = ac

      let run = await save(ctx, { ...EMPTY, goal, startedAt: Date.now() }, { status: 'running' })

      try {
        let text = ''
        for await (const ev of ctx.agent(goal, {
          signal: ac.signal,
          maxIterations: 12,
          stream: true,
        })) {
          yield ev
          if (ev.type === 'text-delta') text += ev.text
          if (ev.type !== 'tool' && ev.type !== 'turn' && ev.type !== 'done' && ev.type !== 'error') continue
          const step: Step =
            ev.type === 'tool'
              ? { phase: 'tool', name: ev.name, at: Date.now() }
              : ev.type === 'turn'
                ? { phase: 'turn', turn: ev.turn, at: Date.now() }
                : ev.type === 'done'
                  ? { phase: 'done', at: Date.now() }
                  : { phase: 'error', text: ev.message, at: Date.now() }
          run = { ...run, steps: [...run.steps, step] }
          await ctx.storage.kv().set('run', run)
        }
        const cur = await load(ctx)
        await save(ctx, cur, { status: 'done', result: text.slice(-4000) })
        return { ok: true, started: true }
      } catch (cause) {
        const msg = cause instanceof Error ? cause.message : String(cause)
        const cur = await load(ctx)
        await save(ctx, cur, { status: 'error', result: msg })
        throw cause
      } finally {
        if (currentAbort === ac) currentAbort = null
      }
    },

    async cancel(ctx) {
      currentAbort?.abort()
      currentAbort = null
      await save(ctx, await load(ctx), { status: 'cancelled' })
      return { ok: true }
    },
  },
})
