import type { Api, Model } from '@earendil-works/pi-ai'
import { describe, expect, it } from 'vitest'

import { completionReasoning } from '../src/completion-reasoning.ts'

function model(patch: Partial<Model<Api>> & Pick<Model<Api>, 'reasoning'>): Model<Api> {
  return {
    id: 'm',
    name: 'm',
    api: 'openai-completions',
    provider: 'test',
    baseUrl: 'https://example.test/v1',
    input: ['text'],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: 1,
    maxTokens: 1,
    ...patch,
  }
}

describe('completionReasoning', () => {
  it('keeps the default when Pi accepts off', async () => {
    expect(await completionReasoning(model({ reasoning: false }))).toBeUndefined()
    expect(await completionReasoning(model({ reasoning: true }))).toBeUndefined()
    expect(await completionReasoning(model({
      reasoning: true,
      thinkingLevelMap: { off: 'none' },
    }))).toBeUndefined()
  })

  it('uses the level Pi names when this model refuses off', async () => {
    expect(await completionReasoning(model({
      reasoning: true,
      thinkingLevelMap: { off: null, minimal: null, low: 'light' },
    }))).toBe('low')
  })
})
