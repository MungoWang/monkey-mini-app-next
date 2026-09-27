import { aboutInfo } from './ports.ts'

export interface UpdateCheck {
  readonly name: string
  readonly current: string
  readonly latest: string | null
  readonly updateAvailable: boolean
  readonly error?: string
}

/** Ask the package registry once. A private package is not on that registry. */
export async function checkPackageUpdate(
  about: ReturnType<typeof aboutInfo> = aboutInfo(),
): Promise<UpdateCheck> {
  const empty = { name: about.name, current: about.current, latest: null, updateAvailable: false }
  if (about.name.length === 0) return { ...empty, error: 'package name is missing' }
  if (about.private) return { ...empty, latest: about.current }
  try {
    const response = await fetch(`https://registry.npmjs.org/${about.name}/latest`, {
      signal: AbortSignal.timeout(3_000),
    })
    if (!response.ok) return { ...empty, error: `package registry returned ${response.status}` }
    const body = await response.json() as { version?: unknown }
    const latest = typeof body.version === 'string' ? body.version : null
    return {
      ...empty,
      latest,
      updateAvailable: latest !== null && latest !== about.current,
    }
  } catch (error) {
    return { ...empty, error: error instanceof Error ? error.message : 'update check failed' }
  }
}
