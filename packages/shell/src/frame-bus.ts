/** How many author events one app keeps before its iframe is mounted. Matches the host tail. */
const frameTail = 50

export interface FramePush {
  readonly appId: string
  readonly name: string
  readonly data: unknown
  readonly seq: number
}

/**
 * One socket's app events, delivered into whichever iframes are mounted.
 * A push that arrives before the iframe is kept and flushed on mount.
 * @param post - deliver one message; false means the iframe is not there yet
 */
export function createFrameBus(post: (appId: string, message: unknown) => boolean) {
  const tails = new Map<string, FramePush[]>()
  const gaps = new Map<string, number>()
  const delivered = new Map<string, number>()
  const mounted = new Set<string>()

  function remember(event: FramePush): void {
    const list = tails.get(event.appId) ?? []
    if (list.some(item => item.seq === event.seq)) return
    list.push(event)
    list.sort((left, right) => left.seq - right.seq)
    if (list.length > frameTail) list.splice(0, list.length - frameTail)
    tails.set(event.appId, list)
  }

  function flush(appId: string): void {
    if (!mounted.has(appId)) return
    const since = gaps.get(appId)
    if (since !== undefined) {
      if (!post(appId, { appId, type: 'app:gap', since })) return
      gaps.delete(appId)
    }
    let last = delivered.get(appId) ?? 0
    for (const event of tails.get(appId) ?? []) {
      if (event.seq <= last) continue
      if (!post(appId, { appId, name: event.name, data: event.data, seq: event.seq })) return
      last = event.seq
      delivered.set(appId, last)
    }
  }

  return {
    /** The iframes currently in the document. A removed id is delivered again from the tail when it returns. */
    sync(live: ReadonlySet<string>): void {
      for (const appId of mounted) {
        if (live.has(appId)) continue
        mounted.delete(appId)
        delivered.delete(appId)
      }
      for (const appId of live) {
        mounted.add(appId)
        flush(appId)
      }
    },
    push(event: FramePush): void {
      remember(event)
      flush(event.appId)
    },
    gap(appId: string, since: number): void {
      gaps.set(appId, since)
      tails.delete(appId)
      delivered.delete(appId)
      flush(appId)
    },
  }
}
