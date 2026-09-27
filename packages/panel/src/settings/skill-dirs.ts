const customKey = 'mini-app.panel.skill-dirs'
const selectedKey = 'mini-app.panel.skill-agents'

/** Custom `.../skills` directories remembered in this browser. */
export function readSkillCustomDirs(): string[] {
  return readList(customKey)
}

export function writeSkillCustomDirs(dirs: readonly string[]): void {
  writeList(customKey, dirs)
}

export function readSkillAgentIds(): string[] | undefined {
  const rows = readList(selectedKey)
  return rows.length === 0 ? undefined : rows
}

export function writeSkillAgentIds(ids: readonly string[]): void {
  writeList(selectedKey, ids)
}

function readList(key: string): string[] {
  if (typeof localStorage === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (raw === null || raw.length === 0) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
  } catch {
    return []
  }
}

function writeList(key: string, dirs: readonly string[]): void {
  try {
    localStorage.setItem(key, JSON.stringify([...dirs]))
  } catch {
    // A failed write still changes the current view.
  }
}
