/** Brain interface and the echo provider. @module @mohou/runtime-provider */

export const packageId = '@mohou/runtime-provider' as const

export { ProviderError, providerCodes, type ProviderCode } from './codes.ts'
export type { ModelListing, RuntimeAgentOptions, RuntimeLlmOptions, RuntimeProvider, RuntimeProviderConfig, SettingsField } from './provider.ts'
export { assertKnownModel, type ModelChoice } from './model-choice.ts'
export { createProviderRegistry, type ProviderRegistry } from './registry.ts'
export { createEchoProvider } from './echo.ts'
