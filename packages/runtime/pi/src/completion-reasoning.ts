import type { Api, Model, ThinkingLevel } from '@earendil-works/pi-ai'

/**
 * Thinking level for one completion.
 * Loads `pi-ai` only when a completion runs (optional peer).
 * `clampThinkingLevel(model, 'off')` is Pi's off for this model.
 * `off` is omitted: Pi sends `thinkingLevelMap.off` when that token exists, otherwise the call keeps the server default.
 * @param model - the resolved catalog model
 */
export async function completionReasoning(model: Model<Api>): Promise<ThinkingLevel | undefined> {
  if (!model.reasoning) return undefined
  const { clampThinkingLevel } = await import('@earendil-works/pi-ai')
  const level = clampThinkingLevel(model, 'off')
  if (level === 'off') return undefined
  return level
}
