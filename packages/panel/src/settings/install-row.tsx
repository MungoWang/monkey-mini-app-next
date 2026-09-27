import { Loader2 } from 'lucide-react'
import type { ReactNode } from 'react'

/** Toggle one id in a remembered pick set. */
export function toggleId(current: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(current)
  if (next.has(id)) next.delete(id)
  else next.add(id)
  return next
}

/** Home-relative dest shown next to the status caption. */
export function shortHomePath(dest: string): string {
  const unix = dest.match(/^(\/Users\/[^/]+|\/home\/[^/]+)/)
  if (unix !== null && unix[1] !== undefined) return `~${dest.slice(unix[1].length)}`
  const windows = dest.match(/^[A-Za-z]:\\Users\\[^\\]+/)
  if (windows !== null && windows[0] !== undefined) return `~${dest.slice(windows[0].length).replace(/\\/g, '/')}`
  return dest
}

/** Custom dests must end with a `skills` folder. */
export function endsWithSkills(raw: string): boolean {
  const text = raw.trim().replace(/\\/g, '/').replace(/\/+$/, '')
  return text === 'skills' || text.endsWith('/skills')
}

/** Caption while a picked dest is being written. */
export function installingCaption(label: (key: string) => string): ReactNode {
  return (
    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
      <Loader2 size={11} className="animate-spin" />
      {label('installing')}
    </span>
  )
}
