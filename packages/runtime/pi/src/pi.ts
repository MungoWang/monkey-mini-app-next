import type { AppLlmEvent } from '@mohou/contract'
import type { RuntimeLlmOptions } from '@mohou/runtime-provider'
import { ProviderError, type ModelListing, type RuntimeProvider, type RuntimeProviderConfig } from '@mohou/runtime-provider'

import { piDefaultModel, runPiAgent, selectedModel } from './agent-session.ts'
import { completionReasoning } from './completion-reasoning.ts'

/**
 * True when Node can resolve the optional Pi packages (peer / environment).
 * Does not scan install paths — ordinary package resolution only.
 */
export async function probePiRuntime(): Promise<boolean> {
  try {
    await import('@earendil-works/pi-coding-agent')
    await import('@earendil-works/pi-ai')
    return true
  } catch {
    return false
  }
}

/**
 * Pi catalog brain. Pi owns the catalog path and the provider API.
 * `llm` calls `ModelRuntime.completeSimple`. `models` calls `getModels`.
 * Requires optional peers `@earendil-works/pi-coding-agent` and `pi-ai` at call time.
 */
export function createPiProvider(): RuntimeProvider {
  let running = false
  let config: RuntimeProviderConfig = {}
  return {
    id: 'pi',
    label: 'Pi',
    configure(next) {
      config = next
    },
    start() {
      running = true
      return Promise.resolve()
    },
    stop() {
      running = false
      return Promise.resolve()
    },
    healthy() {
      return running
    },
    async models() {
      const runtime = await openRuntime().catch(() => undefined)
      return runtime === undefined ? [] : listings(runtime.getModels())
    },
    async llm(prompt, call) {
      return complete(config, running, prompt, call)
    },
    async agent(goal, call) {
      const failed = notRunning(running, call?.signal)
      if (failed) return failed
      if (goal.length === 0) throw new ProviderError('empty-completion', 'agent returned an empty completion')
      return runPiAgent(config, goal, call)
    },
  }
}

async function openRuntime() {
  const { ModelRuntime } = await import('@earendil-works/pi-coding-agent')
  return ModelRuntime.create({ refreshOnCreate: false })
}

async function complete(
  config: RuntimeProviderConfig,
  running: boolean,
  prompt: string,
  call: RuntimeLlmOptions | undefined,
): Promise<string> {
  const failed = notRunning(running, call?.signal)
  if (failed) return failed
  if (prompt.length === 0) {
    throw new ProviderError('empty-completion', 'llm returned an empty completion')
  }
  const { SettingsManager, getAgentDir } = await import('@earendil-works/pi-coding-agent')
  const runtime = await openRuntime().catch((error: unknown) => {
    throw new ProviderError('provider-unhealthy', 'pi completion failed', { cause: error })
  })
  const model = selectedModel(runtime, config, call) ?? piDefaultModel(runtime, SettingsManager.create(process.cwd(), getAgentDir()))
  if (model === undefined) throw new ProviderError('unknown-model', 'pi model selection is incomplete')
  const reasoning = await completionReasoning(model)
  const context = {
    messages: [{ role: 'user' as const, content: prompt, timestamp: Date.now() }],
    ...call?.system === undefined ? {} : { systemPrompt: call.system },
  }
  const request = {
    ...reasoning === undefined ? {} : { reasoning },
    ...call?.maxTokens === undefined ? {} : { maxTokens: call.maxTokens },
    ...call?.signal === undefined ? {} : { signal: call.signal },
  }
  const message = await (call?.stream === true
    ? readStream(runtime.streamSimple(model, context, request), call)
    : runtime.completeSimple(model, context, request)
  ).catch((error: unknown) => {
    if (call?.signal?.aborted) throw new ProviderError('cancelled', 'cancelled', { cause: error })
    throw new ProviderError('provider-unhealthy', 'pi completion failed', { cause: error })
  })
  if (call?.signal?.aborted || message.stopReason === 'aborted') throw new ProviderError('cancelled', 'cancelled')
  if (message.stopReason === 'error') throw new ProviderError('provider-unhealthy', 'pi completion failed')
  const text = messageText(message.content)
  if (text.length === 0) throw new ProviderError('empty-completion', 'llm returned an empty completion')
  return text
}

async function readStream(
  stream: AsyncIterable<{ type: string; delta?: string }> & { result: () => Promise<{ stopReason: string; content: unknown }> },
  call: RuntimeLlmOptions,
): Promise<{ stopReason: string; content: unknown }> {
  observeLlm(call, { type: 'status', status: 'running' })
  for await (const event of stream) {
    if (event.type === 'text_delta' && typeof event.delta === 'string' && event.delta.length > 0) {
      observeLlm(call, { type: 'text-delta', text: event.delta })
    }
  }
  const message = await stream.result()
  const text = messageText(message.content)
  if (text.length > 0) observeLlm(call, { type: 'done', text })
  return message
}

function observeLlm(call: RuntimeLlmOptions, event: AppLlmEvent): void {
  try {
    call.onEvent?.(event)
  } catch {
    // A throwing observer does not abort the completion.
  }
}

function listings(models: readonly { readonly provider: string; readonly id: string }[]): ModelListing[] {
  const groups = new Map<string, string[]>()
  for (const model of models) {
    const list = groups.get(model.provider)
    if (list === undefined) groups.set(model.provider, [model.id])
    else list.push(model.id)
  }
  return [...groups].map(([provider, names]) => ({ provider, models: names }))
}

function messageText(content: unknown): string {
  if (!Array.isArray(content)) return ''
  return content.flatMap((part) => {
    if (typeof part !== 'object' || part === null) return []
    const record = part as { type?: unknown; text?: unknown }
    return record.type === 'text' && typeof record.text === 'string' ? [record.text] : []
  }).join('').trim()
}

function notRunning(running: boolean, signal: AbortSignal | undefined): Promise<never> | undefined {
  if (signal?.aborted) return Promise.reject(new ProviderError('cancelled', 'cancelled'))
  if (!running) return Promise.reject(new ProviderError('provider-unhealthy', 'runtime provider is not started'))
  return undefined
}
