import { ProviderError } from './codes.ts'
import type { RuntimeProvider } from './provider.ts'

/** Registrations of brains Shell knows how to construct. */
export interface ProviderRegistry {
  register(provider: RuntimeProvider): () => void
  get(id: string): RuntimeProvider
  ids(): readonly string[]
}

/** A registry whose `register` returns the disposer. A second id throws. */
export function createProviderRegistry(): ProviderRegistry {
  const providers = new Map<string, RuntimeProvider>()
  return {
    register(provider) {
      if (providers.has(provider.id)) {
        throw new ProviderError('provider-duplicate', `already registered: ${provider.id}`)
      }
      providers.set(provider.id, provider)
      return () => {
        providers.delete(provider.id)
      }
    },
    get(id) {
      const found = providers.get(id)
      if (found === undefined) {
        throw new ProviderError('provider-missing', `no runtime provider: ${id}`)
      }
      return found
    },
    ids() {
      return [...providers.keys()]
    },
  }
}
