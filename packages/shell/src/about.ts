import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const names = ['@mohou/host', '@mohou/shell'] as const

/**
 * Versions for the settings about block. Reads the package files. Does not invent a number.
 * @returns one line per readable package
 */
export function aboutVersions(): string {
  return names.flatMap((name) => {
    const version = packageVersion(name)
    return version === undefined ? [] : [`${name} ${version}`]
  }).join('\n')
}

function packageVersion(name: string): string | undefined {
  try {
    const file = createRequire(import.meta.url).resolve(`${name}/package.json`)
    const parsed = JSON.parse(readFileSync(file, 'utf8')) as { version?: unknown }
    return typeof parsed.version === 'string' && parsed.version.length > 0 ? parsed.version : undefined
  } catch {
    return undefined
  }
}
