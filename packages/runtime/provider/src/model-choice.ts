import { ProviderError } from './codes.ts'
import type { RuntimeProvider } from './provider.ts'

/** The vendor and model on one call. Neither is the brain id. */
export interface ModelChoice {
  readonly provider?: string
  readonly model?: string
}

/**
 * Admit a call's vendor and model against the brain's catalog.
 * A brain that does not implement `models` accepts any pair.
 * This does not change the brain id or its tools.
 * @param provider - the registered brain
 * @param choice - call options, after host policy filled omissions
 */
export async function assertKnownModel(provider: RuntimeProvider, choice: ModelChoice): Promise<void> {
  if (provider.models === undefined) return
  const listings = await provider.models()
  const vendor = choice.provider
  const model = choice.model
  if (vendor === undefined && model === undefined) return

  if (vendor !== undefined) {
    const listing = listings.find(item => item.provider === vendor)
    if (listing === undefined) {
      throw new ProviderError('unknown-model-provider', `unknown model provider: ${vendor}`)
    }
    if (model !== undefined && !listing.models.includes(model)) {
      throw new ProviderError('unknown-model', `unknown model: ${vendor}/${model}`)
    }
    return
  }

  const owners = listings.filter(item => item.models.includes(model ?? ''))
  if (owners.length !== 1) {
    throw new ProviderError('unknown-model', `unknown model: ${model ?? ''}`)
  }
}
