import { useEffect, useReducer, type ReactNode } from 'react'

import { panelText, type PanelLabelMode, type PanelLocale } from '../labels.ts'
import type { ThemeClient, ThemePin } from './client.ts'
import { loadAppFile, loadPalettes, loadPin, reduceTheme, savePin, themeState } from './state.ts'

/**
 * Theme picker. Hidden when Host exposes no theme client. No route string lives here.
 * The app-file row appears only in app scope when `theme.css` parsed.
 * @param props - client, scope, and chrome locale
 */
export function PanelTheme(props: {
  readonly client?: ThemeClient
  readonly appId?: string
  readonly appFile?: boolean
  readonly locale: PanelLocale
  readonly mode: PanelLabelMode
}): ReactNode {
  const [state, dispatch] = useReducer(reduceTheme, undefined, themeState)
  useEffect(() => {
    if (props.client === undefined) return
    void loadPalettes(props.client, dispatch)
    if (props.appId === undefined) return
    void loadPin(props.client, props.appId, dispatch)
    if (props.client.appFile === undefined) return
    void loadAppFile(props.client, props.appId, dispatch)
  }, [props.client, props.appId])
  if (props.client === undefined) return null
  const label = (key: string) => panelText(props.locale, key, props.mode)
  const client = props.client
  const appId = props.appId
  const choose = (pin: ThemePin) => {
    if (appId === undefined) return
    void savePin(client, appId, pin, dispatch)
  }
  return (
    <section className="flex max-h-80 w-72 flex-col gap-1 overflow-auto rounded-xl border bg-card p-2 text-card-foreground shadow-lg">
      {state.failed ? <p className="px-2 py-1 text-xs text-destructive">{state.error !== undefined && state.error.length > 0 ? state.error : label('theme-save-failed')}</p> : null}
      <PinButton label={label('clear-pin')} pressed={pressed(state.pin, { kind: 'default' }, appId)} onClick={() => choose({ kind: 'default' })} />
      <PinButton label={label('follow-host')} pressed={pressed(state.pin, { kind: 'follow-host' }, appId)} onClick={() => choose({ kind: 'follow-host' })} />
      {(state.appFile || props.appFile === true) && appId !== undefined ? (
        <PinButton label={label('app-file')} pressed={pressed(state.pin, { kind: 'app-file' }, appId)} onClick={() => choose({ kind: 'app-file' })} />
      ) : null}
      <ul className="flex flex-col gap-1">
        {state.palettes.map(palette => (
          <li key={palette.id}>
            <PinButton
              label={palette.name}
              pressed={pressed(state.pin, { kind: 'palette', id: palette.id }, appId)}
              onClick={() => choose({ kind: 'palette', id: palette.id })}
            />
          </li>
        ))}
      </ul>
      {state.ignored.map(item => <p key={item.file} className="px-2 text-[11px] text-muted-foreground">{item.reason}</p>)}
    </section>
  )
}

function PinButton(props: { readonly label: string; readonly pressed: boolean; readonly onClick: () => void }): ReactNode {
  return (
    <button type="button" className="flex h-9 w-full items-center rounded-lg px-2 text-left text-sm hover:bg-muted data-[on=1]:bg-muted" data-on={props.pressed ? '1' : '0'} aria-pressed={props.pressed} onClick={props.onClick}>
      <span>{props.label}</span>
    </button>
  )
}

function pressed(current: ThemePin, next: ThemePin, appId: string | undefined): boolean {
  if (appId === undefined) return false
  if (current.kind !== next.kind) return false
  if (current.kind === 'palette' && next.kind === 'palette') return current.id === next.id
  return true
}
