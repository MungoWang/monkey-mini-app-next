import type { AppAgentEvent, AppLlmEvent } from '@mini-app/contract'
import { agentEventType, eventType, llmEventType } from '@mini-app/contract/event-type'
import { createElement, type ReactNode } from 'react'

import { AppIdContext } from './app-id.ts'

export type AppEvent = { name: string; data: unknown }

export { agentEventType, eventType, llmEventType }

/** `ctx.llm` observation. Same union the host writes. */
export type LlmEvent = AppLlmEvent

/** `ctx.agent` observation. Same union the host writes. */
export type AgentEvent = AppAgentEvent

export interface AppHandle {
  call: (method: string, args?: unknown) => Promise<unknown>
  /** Yields what the method yields. Awaiting the same object is the method return. */
  streamCall: (method: string, args?: unknown) => AsyncIterable<unknown> & Promise<unknown>
  on: (name: string, cb: (data: unknown) => void) => () => void
  onAny: (cb: (event: AppEvent) => void) => () => void
  /** URL for a file under `assets/`. Throws `asset-invalid` when the path is not that tree. */
  resolveAssetUrl: (path: string) => string
}

const hostBinding = 'miniAppHost'

/** Host runner still wraps the tree. Authors do not construct this. */
export function AppRuntime(props: { appId: string; children: ReactNode }) {
  return createElement(AppIdContext.Provider, { value: props.appId }, props.children)
}

/**
 * App UI handle. `call` throws outside the host wrapper.
 * The wrapper installs the live handle on `globalThis.miniAppHost`.
 */
export function useApp(): AppHandle {
  const realm = globalThis as { miniAppHost?: { useApp: () => AppHandle } }
  const host = realm[hostBinding]
  if (host === undefined) throw new Error('useApp() call is outside the host wrapper')
  return host.useApp()
}
