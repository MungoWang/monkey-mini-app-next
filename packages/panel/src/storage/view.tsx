import { useEffect, useReducer, useState, type ReactNode } from 'react'

import { panelText, type PanelLabelMode, type PanelLocale } from '../labels.ts'
import { Dialog } from '../ui/dialog.tsx'
import type { StorageClient } from './client.ts'
import { loadStorage, loadTable, reduceStorage, storageState } from './state.ts'

/**
 * Read-only storage browse. Hidden when Host exposes no storage client. No route string lives here.
 * @param props - client, app, chrome locale, the pane close control, and an optional size notice
 */
export function PanelStorage(props: {
  readonly client?: StorageClient
  readonly appId: string
  readonly locale: PanelLocale
  readonly mode: PanelLabelMode
  readonly onClose?: () => void
  readonly notice?: string
}): ReactNode {
  const [state, dispatch] = useReducer(reduceStorage, undefined, storageState)
  useEffect(() => {
    if (props.client === undefined) return
    void loadStorage(props.client, props.appId, dispatch)
  }, [props.client, props.appId])
  if (props.client === undefined) return null
  const label = (key: string) => panelText(props.locale, key, props.mode)
  const client = props.client
  const rows = state.rows?.rows
  const [raw, setRaw] = useState(false)
  const [askRestore, setAskRestore] = useState(false)
  return (
    <section className="flex min-h-0 flex-1 flex-col bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <div className="min-w-0">
          <h3 className="text-[15px] font-semibold">{label('storage')}</h3>
          {state.summary === undefined ? null : (
            <p className="text-xs text-muted-foreground">{`${formatBytes(state.summary.bytes)} · ${state.summary.tables.length}`}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {state.summary === undefined || client.restoreStorage === undefined ? null : (
            <button type="button" className="h-8 rounded-lg border px-3 text-sm hover:bg-muted" onClick={() => setAskRestore(true)}>{label('restore-storage')}</button>
          )}
          <PaneClose label={label('pane-close')} onClose={props.onClose} />
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-auto">
        {props.notice !== undefined && !state.noticeDismissed ? (
          <div className="mx-4 mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2">
            <p className="min-w-0 flex-1 text-sm">{props.notice}</p>
            <button type="button" className="h-8 shrink-0 rounded-lg px-2 text-sm hover:bg-muted" onClick={() => dispatch({ type: 'dismiss-notice' })}>{label('dismiss')}</button>
          </div>
        ) : null}
        {state.failed ? <p className="px-4 py-3 text-sm text-destructive">{state.error !== undefined && state.error.length > 0 ? state.error : label('storage-failed')}</p> : null}
        <div className="grid min-h-0 grid-cols-1 min-[720px]:grid-cols-[14rem_minmax(0,1fr)]">
          <ul className="flex flex-col gap-2 p-3">
            {(state.summary?.tables ?? []).map(table => (
              <li key={table}>
                <button
                  type="button"
                  className="w-full rounded-xl border bg-card px-3 py-2 text-left font-mono text-sm data-[on=1]:border-primary"
                  aria-pressed={state.table === table}
                  data-on={state.table === table ? '1' : '0'}
                  onClick={() => { void loadTable(client, props.appId, table, dispatch) }}
                >{table}</button>
              </li>
            ))}
          </ul>
          <div className="min-w-0 p-4">
            {state.tableFailed ? <p className="text-sm text-destructive">{state.tableError !== undefined && state.tableError.length > 0 ? state.tableError : label('storage-failed')}</p> : null}
            {state.table === undefined ? null : (
              <div>
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="font-mono text-sm">{state.table}</h4>
                  {rows === undefined || rows.length === 0 ? null : <ShapeSwitch raw={raw} label={label} onRaw={setRaw} />}
                </div>
                {rows === undefined ? null : rows.length === 0 ? <p className="text-sm text-muted-foreground">{label('storage-empty-rows')}</p> : raw ? (
                  <pre className="overflow-auto rounded-xl border bg-card p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap">{JSON.stringify(rows, null, 2)}</pre>
                ) : (
                  <div className="flex flex-col gap-3">
                    {rows.map((row, index) => (
                      <RecordCard key={recordKey(row, index)} row={row} />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {askRestore ? (
        <Dialog width="sm" onClose={() => setAskRestore(false)}>
          <p className="m-0 text-sm">{label('restore-storage-confirm')}</p>
          <div className="mt-4 flex justify-end gap-2">
            <button type="button" className="h-8 rounded-lg border px-3 text-sm" onClick={() => setAskRestore(false)}>{label('cancel')}</button>
            <button type="button" className="h-8 rounded-lg bg-primary px-3 text-sm font-semibold text-primary-foreground" onClick={() => {
              setAskRestore(false)
              void client.restoreStorage?.(props.appId)
            }}>{label('restore')}</button>
          </div>
        </Dialog>
      ) : null}
    </section>
  )
}

function RecordCard(props: { readonly row: unknown }): ReactNode {
  if (isRecord(props.row) && typeof props.row.key === 'string' && 'value' in props.row) {
    return (
      <article className="overflow-hidden rounded-xl border bg-card">
        <header className="border-b px-3 py-2 font-mono text-xs">{props.row.key}</header>
        <div className="p-3"><ValueView value={props.row.value} /></div>
      </article>
    )
  }
  return (
    <pre className="overflow-auto rounded-xl border bg-card p-3 font-mono text-[12px] leading-5 whitespace-pre-wrap">{JSON.stringify(props.row, null, 2)}</pre>
  )
}

function ValueView(props: { readonly value: unknown }): ReactNode {
  const items = titledItems(props.value)
  if (items !== undefined) {
    return (
      <ul className="flex flex-col gap-1.5">
        {items.map(item => (
          <li key={item.key} className="flex items-baseline justify-between gap-3 text-sm">
            <span className={item.done ? 'text-muted-foreground line-through' : ''}>{item.title}</span>
            {item.extra.length === 0 ? null : <span className="shrink-0 text-[11px] text-muted-foreground">{item.extra}</span>}
          </li>
        ))}
      </ul>
    )
  }
  if (props.value === null || typeof props.value === 'string' || typeof props.value === 'number' || typeof props.value === 'boolean') {
    return <span className="text-sm">{props.value === null ? '—' : String(props.value)}</span>
  }
  return <pre className="overflow-auto font-mono text-[12px] leading-5 whitespace-pre-wrap">{JSON.stringify(props.value, null, 2)}</pre>
}

function ShapeSwitch(props: {
  readonly raw: boolean
  readonly label: (key: string) => string
  readonly onRaw: (raw: boolean) => void
}): ReactNode {
  return (
    <div className="flex gap-1 rounded-lg bg-muted p-1">
      <button type="button" className="h-7 rounded-md px-2.5 text-xs data-[on=1]:bg-card data-[on=1]:font-semibold" data-on={props.raw ? '0' : '1'} aria-pressed={!props.raw} onClick={() => props.onRaw(false)}>{props.label('storage-preview')}</button>
      <button type="button" className="h-7 rounded-md px-2.5 text-xs data-[on=1]:bg-card data-[on=1]:font-semibold" data-on={props.raw ? '1' : '0'} aria-pressed={props.raw} onClick={() => props.onRaw(true)}>{props.label('storage-raw')}</button>
    </div>
  )
}

function PaneClose(props: { readonly label: string; readonly onClose?: (() => void) | undefined }): ReactNode {
  if (props.onClose === undefined) return null
  return (
    <button type="button" className="h-8 rounded-lg border bg-background px-3 text-sm hover:bg-muted" onClick={props.onClose}>{props.label}</button>
  )
}

function titledItems(value: unknown): readonly { key: string; title: string; done: boolean; extra: string }[] | undefined {
  if (!Array.isArray(value) || value.length === 0 || !value.every(isRecord)) return undefined
  if (!value.every(item => typeof item.title === 'string')) return undefined
  return value.map((item, index) => ({
    key: typeof item.id === 'string' ? item.id : String(index),
    title: item.title as string,
    done: item.done === true,
    extra: [typeof item.due === 'string' ? item.due : '', Array.isArray(item.tags) ? item.tags.filter(tag => typeof tag === 'string').join(' ') : ''].filter(part => part.length > 0).join(' · '),
  }))
}

function recordKey(row: unknown, index: number): string {
  if (isRecord(row) && typeof row.key === 'string') return row.key
  return String(index)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const kb = bytes / 1024
  if (kb < 1024) return `${trim(kb)} KB`
  return `${trim(kb / 1024)} MB`
}

function trim(value: number): string {
  return value >= 10 ? String(Math.round(value)) : String(Math.round(value * 10) / 10)
}
