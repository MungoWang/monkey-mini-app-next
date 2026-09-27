/**
 * Every `type` on `ctx.llm` when `stream` is true.
 * `done` is that call's final string. The method return is not one of these.
 */
export const llmEventType = {
  status: 'status',
  textDelta: 'text-delta',
  error: 'error',
  done: 'done',
} as const

/**
 * Every `type` on `ctx.agent` when `stream` is true.
 * `done` is that call's final string. `tool` and `turn` are agent-only.
 */
export const agentEventType = {
  ...llmEventType,
  tool: 'tool',
  turn: 'turn',
} as const

/** Every `type` on either model stream. */
export const eventType = {
  ...agentEventType,
} as const

export type LlmEventType = (typeof llmEventType)[keyof typeof llmEventType]

export type AgentEventType = (typeof agentEventType)[keyof typeof agentEventType]

export type EventType = (typeof eventType)[keyof typeof eventType]
