const selectedKey = 'mini-app.panel.mcp-agents'

/** Assistants remembered for the authoring MCP install. */
export function readAuthorMcpAgentIds(): string[] | undefined {
  if (typeof localStorage === 'undefined') return undefined
  try {
    const raw = localStorage.getItem(selectedKey)
    if (raw === null || raw.length === 0) return undefined
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return undefined
    const ids = parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    return ids.length === 0 ? undefined : ids
  } catch {
    return undefined
  }
}

export function writeAuthorMcpAgentIds(ids: readonly string[]): void {
  try {
    localStorage.setItem(selectedKey, JSON.stringify([...ids]))
  } catch {
    // A failed write still changes the current view.
  }
}
