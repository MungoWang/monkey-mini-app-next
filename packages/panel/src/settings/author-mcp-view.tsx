import { useEffect, useState, type ReactNode } from 'react'

import { Dialog } from '../ui/dialog.tsx'
import { readAuthorMcpAgentIds, writeAuthorMcpAgentIds } from './author-mcp.ts'
import type { PanelAbout, PanelAuthorMcpStatus } from './client.ts'
import { installingCaption, shortHomePath, toggleId } from './install-row.tsx'

/**
 * Authoring MCP dest list. One-click merge into assistant MCP files.
 * Generate-snippet stays as a fallback.
 * @param props - status loaders, about reader, and chrome labels
 */
export function AuthorMcpInstall(props: {
  readonly label: (key: string) => string
  readonly readAbout?: () => Promise<PanelAbout>
  readonly readAuthorMcp?: () => Promise<PanelAuthorMcpStatus>
  readonly installAuthorMcp?: (agentIds: readonly string[], description: string) => Promise<PanelAuthorMcpStatus>
  readonly revealAuthorMcp?: (dest: string) => Promise<void>
}): ReactNode {
  const [status, setStatus] = useState<PanelAuthorMcpStatus | undefined>(undefined)
  const [busy, setBusy] = useState(false)
  const [failed, setFailed] = useState(false)
  const [picked, setPicked] = useState<ReadonlySet<string>>(() => new Set(readAuthorMcpAgentIds() ?? []))
  const [snippetOpen, setSnippetOpen] = useState(false)
  const [about, setAbout] = useState<PanelAbout | undefined>(undefined)
  useEffect(() => {
    if (props.readAuthorMcp === undefined) return
    void props.readAuthorMcp().then((next) => {
      setStatus(next)
      if (readAuthorMcpAgentIds() === undefined) {
        setPicked(new Set(next.agents.filter(agent => agent.homePresent).map(agent => agent.id)))
      }
    }, () => setStatus(undefined))
  }, [props.readAuthorMcp])
  if (props.readAuthorMcp === undefined && props.readAbout === undefined) return null
  return (
    <div className="rounded-2xl border bg-card px-4 py-3">
      <p className="m-0 text-sm font-medium">{props.label('mcp-authoring')}</p>
      <p className="mt-1 mb-3 text-xs text-muted-foreground">{props.label('mcp-authoring-help')}</p>
      {props.readAuthorMcp === undefined ? null : (
        <ul className="m-0 mb-3 flex list-none flex-col gap-1 p-0">
          {(status?.agents ?? []).map(agent => (
            <li key={agent.id} className={agent.homePresent ? 'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted' : 'flex w-full items-center gap-2 rounded-lg px-2 py-1.5 opacity-50 hover:bg-muted'}>
              <input type="checkbox" checked={picked.has(agent.id)} onChange={() => {
                const next = toggleId(picked, agent.id)
                setPicked(next)
                writeAuthorMcpAgentIds([...next])
              }} />
              <span className="text-sm">{agent.label}</span>
              <span className="ml-4 flex min-w-0 items-center gap-2">
                {agent.homePresent ? null : <span className="text-[11px] text-muted-foreground">{props.label('skill-missing-home')}</span>}
                {busy && picked.has(agent.id) ? installingCaption(props.label) : authorMcpCaption(agent, props.label)}
                {agent.installed && props.revealAuthorMcp !== undefined ? (
                  <button type="button" className="max-w-[28rem] truncate font-mono text-[11px] text-muted-foreground underline-offset-2 hover:underline" title={agent.dest} onClick={() => { void props.revealAuthorMcp?.(agent.dest) }}>{shortHomePath(agent.dest)}</button>
                ) : null}
              </span>
              {agent.adapter === undefined ? null : (
                <span className="ml-auto shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-normal text-muted-foreground" data-adapter={agent.adapter}>{agent.adapter}</span>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap gap-2">
        {props.installAuthorMcp === undefined ? null : (
          <button type="button" className="h-8 rounded-lg border px-3 text-sm hover:bg-muted disabled:opacity-60" disabled={busy} onClick={() => {
            const install = props.installAuthorMcp
            if (install === undefined) return
            setBusy(true)
            setFailed(false)
            void install([...picked], props.label('mcp-authoring-blurb')).then(setStatus, () => setFailed(true)).finally(() => setBusy(false))
          }}>{busy ? '…' : props.label(authorMcpNeedsUpdate(status, picked) ? 'mcp-authoring-update-install' : 'mcp-authoring-install')}</button>
        )}
        {props.readAbout === undefined ? null : (
          <button type="button" className="h-8 rounded-lg border px-3 text-sm hover:bg-muted" onClick={() => {
            const read = props.readAbout
            if (read === undefined) return
            void read().then((value) => {
              setAbout(value)
              setSnippetOpen(true)
            }, () => setAbout(undefined))
          }}>{props.label('mcp-authoring-generate')}</button>
        )}
      </div>
      {failed ? <p className="mt-2 mb-0 text-xs text-destructive">{props.label('mcp-authoring-failed')}</p> : null}
      {snippetOpen && about !== undefined ? (
        <AuthoringDialog about={about} label={props.label} onClose={() => setSnippetOpen(false)} />
      ) : null}
    </div>
  )
}

function authorMcpCaption(
  row: { readonly installed: boolean; readonly updateAvailable: boolean },
  label: (key: string) => string,
): ReactNode {
  if (!row.installed) return null
  return (
    <span className={row.updateAvailable ? 'text-[11px] text-primary' : 'text-[11px] text-muted-foreground'}>
      {label(row.updateAvailable ? 'skill-update' : 'skill-installed')}
    </span>
  )
}

function authorMcpNeedsUpdate(status: PanelAuthorMcpStatus | undefined, picked: ReadonlySet<string>): boolean {
  if (status === undefined) return false
  return status.agents.some(agent => picked.has(agent.id) && agent.updateAvailable)
}

function AuthoringDialog(props: {
  readonly about: PanelAbout
  readonly label: (key: string) => string
  readonly onClose: () => void
}): ReactNode {
  const [copied, setCopied] = useState(false)
  const snippet = authoringSnippet(props.about.authoring.url, props.about.authoring.token, props.label('mcp-authoring-blurb'))
  return (
    <Dialog width="wide" onClose={props.onClose}>
      <h5 className="m-0 text-base font-semibold">{props.label('mcp-authoring')}</h5>
      <p className="mt-1 text-sm text-muted-foreground">{props.label('mcp-authoring-help')}</p>
      <ul className="mt-4 max-h-56 overflow-auto rounded-xl border bg-muted/40 p-2">
        {props.about.authoring.tools.map(tool => (
          <li key={tool.name} className="rounded-lg px-3 py-2">
            <p className="m-0 font-mono text-sm font-medium">{tool.name}</p>
            <p className="mt-0.5 mb-0 text-xs leading-5 text-muted-foreground">{tool.description}</p>
          </li>
        ))}
      </ul>
      <pre className="mt-4 overflow-auto rounded-xl border bg-muted p-3 font-mono text-xs">{snippet}</pre>
      <div className="mt-3 flex justify-end gap-2">
        <button type="button" className="h-8 rounded-lg border px-3 text-sm" onClick={() => {
          void navigator.clipboard.writeText(snippet).then(() => {
            setCopied(true)
            window.setTimeout(() => setCopied(false), 1600)
          })
        }}>{copied ? props.label('mcp-copied') : props.label('mcp-copy')}</button>
        <button type="button" className="h-8 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground" onClick={props.onClose}>{props.label('confirm')}</button>
      </div>
    </Dialog>
  )
}

function authoringSnippet(url: string, token: string, description: string): string {
  return `${JSON.stringify({
    'mini-app': {
      url,
      transport: 'streamable-http',
      description,
      headers: { Authorization: `Bearer ${token}` },
      _monkeyagent: { description },
    },
  }, null, 2)}\n`
}
