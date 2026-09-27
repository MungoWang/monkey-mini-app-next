import type { Branded } from '@mini-app/values'

import { ContractError } from './codes.ts'

const appIdPattern = /^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$/

/** Reverse-DNS app id admitted at this boundary. */
export type AppId = Branded<'AppId'>

/**
 * Admit an app id. Callers do not re-parse the brand.
 * @param value - untrusted id text
 * @returns the branded id
 */
export function parseAppId(value: string): AppId {
  if (!appIdPattern.test(value)) {
    throw new ContractError('app-id-invalid', `app id is not reverse-DNS: ${value}`)
  }
  return value as AppId
}
