/** Credential detection and masking for MCP config values. One home, so every caller agrees. */

/**
 * Broad name test for handing the ambient environment to a child process.
 * A false positive only withholds one variable; a false negative leaks a key to a third-party
 * server. Callers that display a value use {@link namesCredential} instead.
 */
const BROAD_NAME = /KEY|SECRET|TOKEN|PASSWORD/i

/** A whole segment of the name says credential. camelCase splits at its case boundary first. */
const CREDENTIAL_WORDS = [
  'KEY', 'SECRET', 'TOKEN', 'PASSWORD', 'PASSWD', 'CREDENTIAL', 'CREDENTIALS',
  'AUTH', 'AUTHORIZATION', 'PRIVATE', 'SIGNATURE', 'COOKIE', 'SESSION',
]
const CREDENTIAL_SEGMENT = new RegExp(`(^|_)(${CREDENTIAL_WORDS.join('|')})(_|$)`)

/**
 * A leading run that names the kind of credential: the scheme of the value, or the issuer's own
 * prefix. None of it is secret, so a masked value keeps it and the caller still reads what it holds.
 */
const CREDENTIAL_LABELS = [
  'bearer\\s+', 'basic\\s+', 'token\\s+', 'apikey\\s+', 'sk-', 'pk-', 'rk-', 'ghp_', 'gho_', 'ghu_',
  'ghs_', 'github_pat_', 'glpat-', 'xox[abprs]-', 'AKIA', 'ASIA', 'eyJ', '-----BEGIN[A-Z ]*-----',
]
const CREDENTIAL_LABEL = new RegExp(`^(${CREDENTIAL_LABELS.join('|')})`, 'i')

/** The shape that carries no label, so only its length gives it away. */
const LONG_HEX = /^[0-9a-f]{32,}$/i

/**
 * Ambient name test for a child's environment. Broad on purpose: see {@link BROAD_NAME}.
 * @param name - environment variable name
 */
export function mayHoldCredential(name: string): boolean {
  return BROAD_NAME.test(name)
}

/**
 * Whether a whole segment of this name says credential. `GITHUB_TOKEN`, `x-api-key`, `apiKey`, and
 * `DB_PASSWORD` pass; `NODE_ENV`, `MONKEY`, and `AUTHOR` do not, so masking them hides nothing.
 * @param name - environment variable or header name
 */
export function namesCredential(name: string): boolean {
  return CREDENTIAL_SEGMENT.test(normalizeName(name))
}

/**
 * Whether the value's own shape is a credential, whatever its name says.
 * @param value - the value to judge
 */
export function looksLikeCredential(value: string): boolean {
  return CREDENTIAL_LABEL.test(value) || LONG_HEX.test(value)
}

/**
 * Whether this entry is a credential, and so must not travel back to a caller in the clear.
 * Either signal is enough: a named key, or a value whose shape gives it away.
 * @param name - environment variable or header name
 * @param value - the value to judge
 */
export function isCredential(name: string, value: string): boolean {
  return namesCredential(name) || looksLikeCredential(value)
}

/**
 * The form a caller may see. A recognized label stays, so `Bearer …` still reads as a bearer token
 * and `ghp_…` as a GitHub token; the body behind it keeps its first and last two characters, and
 * below five characters none of it. `Bearer abcdefgh` becomes `Bearer ab*****gh`.
 * @param value - the credential value
 */
export function maskCredential(value: string): string {
  const label = CREDENTIAL_LABEL.exec(value)?.[0] ?? ''
  const body = value.slice(label.length)
  if (body.length === 0) return value
  if (body.length < 5) return `${label}*****`
  return `${label}${body.slice(0, 2)}*****${body.slice(-2)}`
}

function normalizeName(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase().replace(/[^A-Z0-9]+/g, '_')
}
