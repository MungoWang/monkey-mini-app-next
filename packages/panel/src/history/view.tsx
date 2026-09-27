import { useEffect, useReducer, type ReactNode } from 'react'

import { panelText, type PanelLabelMode, type PanelLocale } from '../labels.ts'
import type { HistoryClient, HistoryCommit, HistoryFile } from './client.ts'
import { historyState, loadCommit, loadHistory, reduceHistory } from './state.ts'

/**
 * Read-only history. Hidden when Host exposes no history client. No route string lives here.
 * @param props - client, app, chrome locale, and the pane close control
 */
export function PanelHistory(props: {
  readonly client?: HistoryClient
  readonly appId: string
  readonly locale: PanelLocale
  readonly mode: PanelLabelMode
  readonly onClose?: () => void
}): ReactNode {
  const [state, dispatch] = useReducer(reduceHistory, undefined, historyState)
  useEffect(() => {
    if (props.client === undefined) return
    void loadHistory(props.client, props.appId, dispatch)
  }, [props.client, props.appId])
  if (props.client === undefined) return null
  const label = (key: string) => panelText(props.locale, key, props.mode)
  const client = props.client
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <h3 className="text-[15px] font-semibold">{label('history')}</h3>
        <PaneClose label={label('pane-close')} onClose={props.onClose} />
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 min-[720px]:grid-cols-[17rem_minmax(0,1fr)]">
        <div className="min-h-0 overflow-auto border-b p-3 min-[720px]:border-r min-[720px]:border-b-0">
          {state.failed ? <p className="text-sm text-destructive">{state.error !== undefined && state.error.length > 0 ? state.error : label('history-failed')}</p> : null}
          {!state.failed && state.commits.length === 0 ? <p className="text-sm text-muted-foreground">{label('history-empty')}</p> : null}
          <ul className="flex flex-col gap-2">
            {state.commits.map(commit => (
              <li key={commit.id}>
                <CommitRow
                  commit={commit}
                  pressed={state.selected === commit.id}
                  onSelect={() => { void loadCommit(client, props.appId, commit.id, dispatch) }}
                />
              </li>
            ))}
          </ul>
        </div>
        <div className="min-h-0 overflow-auto p-4">
          {state.detailFailed ? <p className="text-sm text-destructive">{state.detailError !== undefined && state.detailError.length > 0 ? state.detailError : label('history-failed')}</p> : null}
          {state.detail === undefined ? <p className="text-sm text-muted-foreground">{label('history-pick')}</p> : (
            <div className="flex flex-col gap-3">
              <div>
                <h4 className="text-sm font-semibold">{state.detail.message}</h4>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">{state.selected}</p>
                <time className="mt-1 block text-[11px] text-muted-foreground">{clock(state.detail.time)}</time>
              </div>
              {state.detail.files.map(file => (
                <FilePreview key={file.path} file={file} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function CommitRow(props: {
  readonly commit: HistoryCommit
  readonly pressed: boolean
  readonly onSelect: () => void
}): ReactNode {
  return (
    <button
      type="button"
      className="w-full rounded-xl border bg-card px-3 py-2.5 text-left data-[on=1]:border-primary"
      aria-pressed={props.pressed}
      data-on={props.pressed ? '1' : '0'}
      title={props.commit.id}
      onClick={props.onSelect}
    >
      <span className="flex items-baseline justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-semibold">{props.commit.message.length > 0 ? props.commit.message : props.commit.id.slice(0, 7)}</span>
        <time className="shrink-0 text-[11px] text-muted-foreground">{clock(props.commit.time)}</time>
      </span>
      <span className="mt-1 block font-mono text-[11px] text-muted-foreground">{props.commit.id.slice(0, 7)}</span>
    </button>
  )
}

function FilePreview(props: { readonly file: HistoryFile }): ReactNode {
  const lines = props.file.preview.length === 0 ? [] : props.file.preview.split('\n')
  return (
    <article className="overflow-hidden rounded-xl border bg-card">
      <header className="flex items-center justify-between gap-3 border-b px-3 py-2">
        <span className="min-w-0 truncate font-mono text-xs">{props.file.path}</span>
        <span className="shrink-0 font-mono text-[11px] text-muted-foreground">{`+${props.file.add} −${props.file.del}`}</span>
      </header>
      {lines.length === 0 ? null : (
        <pre className="max-h-80 overflow-auto p-3 font-mono text-[12px] leading-5">
          {lines.map((line, index) => (
            <span key={`${props.file.path}:${index}`} className={lineClass(line)}>{line.length === 0 ? ' ' : line}</span>
          ))}
        </pre>
      )}
    </article>
  )
}

function PaneClose(props: { readonly label: string; readonly onClose?: (() => void) | undefined }): ReactNode {
  if (props.onClose === undefined) return null
  return (
    <button type="button" className="h-8 rounded-lg border bg-background px-3 text-sm hover:bg-muted" onClick={props.onClose}>{props.label}</button>
  )
}

function lineClass(line: string): string {
  if (line.startsWith('+')) return 'block text-primary'
  if (line.startsWith('-')) return 'block text-destructive'
  return 'block text-muted-foreground'
}

function clock(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}
