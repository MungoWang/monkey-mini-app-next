import { timingSafeEqual } from 'node:crypto'

/** A caller is loopback only for these addresses. A missing address is refused. */
export function isLoopbackAddress(address: string | undefined): boolean {
  if (address === undefined || address.length === 0) return false
  const host = address.replace(/^::ffff:/, '')
  return host === '127.0.0.1' || host === '::1' || host === 'localhost'
}

/** Compare a presented token without leaking the length in the match. */
export function authoringTokenMatches(expected: string, presented: string | undefined): boolean {
  if (presented === undefined) return false
  const left = Buffer.from(expected)
  const right = Buffer.from(presented)
  if (left.length !== right.length) {
    timingSafeEqual(left, left)
    return false
  }
  return timingSafeEqual(left, right)
}
