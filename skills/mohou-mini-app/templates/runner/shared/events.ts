export type Step = { phase: string; name?: string; turn?: number; text?: string; at: number }
export type Run = { goal: string; status: string; steps: Step[]; result: string; startedAt: number }

export const EV = {
  run: 'run',
} as const

export type Events = {
  run: Run
}

export type EventName = keyof Events
