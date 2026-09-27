import { useEffect, useReducer, useState, type ReactNode } from 'react'
import { Clock, Database } from 'lucide-react'

import type { PanelClient } from '../gallery/client.ts'
import { PanelGallery } from '../gallery/view.tsx'
import { PanelHistory } from '../history/view.tsx'
import type { HistoryClient } from '../history/client.ts'
import { isPanelLocale, panelText, type PanelLabelMode, type PanelLocale } from '../labels.ts'
import type { PanelPolicy, PanelSettingsClient } from '../settings/client.ts'
import { PanelSettings } from '../settings/view.tsx'
import type { StorageClient } from '../storage/client.ts'
import { PanelStorage } from '../storage/view.tsx'
import type { PaletteChip, ThemeClient } from '../theme/client.ts'
import { ThemeMenu } from '../theme/menu.tsx'
import { reduceSurface, surfaceState, type PanelSection } from './state.ts'

/** Commands Shell can call. Same shape as the shell bridge. No route string lives here. */
export interface PanelControls {
  showApp(appId: string, title?: string): void
  showNotice(appId: string, table: string): void
  unavailable(appId: string): void
  setWorkbench(appId: string): void
}

/**
 * The panel as one surface. A missing client hides that section.
 * @param props - injected clients and chrome locale
 */
export function PanelSurface(props: {
  readonly client: PanelClient
  readonly settings?: PanelSettingsClient
  readonly history?: HistoryClient
  readonly storage?: StorageClient
  readonly theme?: ThemeClient
  readonly appId?: string
  readonly locale: PanelLocale
  readonly mode: PanelLabelMode
  readonly shell: 'standalone' | 'overlay'
  readonly frame?: (appId: string) => ReactNode
  readonly onClosePanel?: () => void
  readonly versions?: string
  readonly onControls?: (controls: PanelControls) => void
}): ReactNode {
  const [state, dispatch] = useReducer(reduceSurface, undefined, surfaceState)
  const [palettes, setPalettes] = useState<readonly PaletteChip[]>([])
  const [desk, setDesk] = useState<string | undefined>(undefined)
  const [hostPolicy, setHostPolicy] = useState<PanelPolicy | undefined>(undefined)
  const [chromeLocale, setChromeLocale] = useState<PanelLocale>(props.locale)
  useEffect(() => {
    setChromeLocale(props.locale)
  }, [props.locale])
  useEffect(() => {
    props.onControls?.({
      showApp: (appId, title) => dispatch({ type: 'show-app', appId, ...title === undefined ? {} : { title } }),
      showNotice: (appId, table) => dispatch({ type: 'show-notice', appId, table }),
      unavailable: appId => dispatch({ type: 'unavailable', appId }),
      setWorkbench: appId => setDesk(appId === 'default' ? undefined : appId),
    })
  }, [props.onControls])
  useEffect(() => {
    if (props.settings === undefined) return
    void props.settings.readPolicy().then(
      policy => setDesk(policy.defaultWorkbenchId),
      () => setDesk(undefined),
    )
  }, [props.settings])
  useEffect(() => {
    if (props.theme === undefined) return
    void props.theme.listPalettes().then(
      listed => setPalettes(listed.palettes),
      () => setPalettes([]),
    )
  }, [props.theme])
  const label = (key: string) => panelText(chromeLocale, key, props.mode)
  useEffect(() => {
    document.title = panelText(chromeLocale, 'product-name', props.mode)
  }, [chromeLocale, props.mode])
  const appId = state.focus?.appId ?? props.appId
  const toggle = (section: PanelSection) => dispatch({ type: 'section', section: state.section === section ? 'gallery' : section })
  const tool = (section: PanelSection, title: string, icon: ReactNode) => (
    <button key={section} type="button" className="inline-flex size-8 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-muted" title={title} onClick={() => toggle(section)}>
      <span className="sr-only">{title}</span>
      {icon}
    </button>
  )
  return (
    <PanelGallery
      client={props.client}
      locale={chromeLocale}
      mode={props.mode}
      shell={props.shell}
      {...desk === undefined ? {} : { defaultWorkbenchId: desk }}
      {...props.settings === undefined ? {} : { onSetDefaultWorkbench: (id: string) => { void writeDefault(props.settings, id, setDesk) } }}
      {...props.theme === undefined ? {} : {
        themeOpen: state.themeOpen,
        onToggleTheme: () => dispatch({ type: 'toggle-theme' }),
      }}
      {...props.settings === undefined ? {} : { onToggleSettings: () => toggle('settings') }}
      theme={app => (
        <ThemeMenu
          locale={chromeLocale}
          mode={props.mode}
          {...props.theme === undefined ? {} : { theme: props.theme }}
          {...props.settings === undefined ? {} : { settings: props.settings }}
          {...app === undefined ? {} : { appId: app.id, appTitle: app.title }}
          {...hostPolicy === undefined ? {} : { hostPolicy }}
          onHostPolicy={setHostPolicy}
        />
      )}
      tools={(
        <>
          {props.history !== undefined && appId !== undefined ? tool('history', label('history'), <Clock size={16} />) : null}
          {props.storage !== undefined && appId !== undefined ? tool('storage', label('storage'), <Database size={16} />) : null}
        </>
      )}
      overlay={chrome => (
        <>
          {state.unavailable === undefined ? null : <p className="px-6 py-2 text-sm text-destructive">{label('host-unreachable')}</p>}
          {props.settings === undefined || state.section !== 'settings' ? null : (
            <div className="absolute inset-0 z-30 flex animate-in flex-col bg-background duration-200 fade-in-0">
              <PanelSettings
                locale={chromeLocale}
                mode={props.mode}
                palettes={palettes}
                cardStyle={chrome.cardStyle}
                onCardStyle={chrome.setCard}
                client={props.settings}
                onPreviewLocale={setChromeLocale}
                onPolicy={(policy) => {
                  setDesk(policy.defaultWorkbenchId)
                  setHostPolicy(policy)
                  if (isPanelLocale(policy.locale)) setChromeLocale(policy.locale)
                }}
                {...hostPolicy === undefined ? {} : { hostPolicy }}
                onClose={() => dispatch({ type: 'section', section: 'gallery' })}
                {...props.versions === undefined ? {} : { versions: props.versions }}
              />
            </div>
          )}
          {state.section === 'history' && appId !== undefined ? (
            <div className="absolute inset-0 z-20 flex min-h-0 animate-in flex-col bg-background duration-200 fade-in-0" data-open="1">
              <PanelHistory
                key={appId}
                appId={appId}
                locale={chromeLocale}
                mode={props.mode}
                onClose={() => dispatch({ type: 'section', section: 'gallery' })}
                {...props.history === undefined ? {} : { client: props.history }}
              />
            </div>
          ) : null}
          {state.section === 'storage' && appId !== undefined ? (
            <div className="absolute inset-0 z-20 flex min-h-0 animate-in flex-col bg-background duration-200 fade-in-0" data-open="1">
              <PanelStorage
                key={appId}
                appId={appId}
                locale={chromeLocale}
                mode={props.mode}
                onClose={() => dispatch({ type: 'section', section: 'gallery' })}
                {...props.storage === undefined ? {} : { client: props.storage }}
                {...state.notice === undefined ? {} : { notice: label('storage-size-notice').replaceAll('{table}', state.notice) }}
              />
            </div>
          ) : null}
        </>
      )}
      {...state.focus === undefined ? {} : { focus: state.focus }}
      {...props.frame === undefined ? {} : { frame: props.frame }}
      {...props.onClosePanel === undefined ? {} : { onClosePanel: props.onClosePanel }}
    />
  )
}

async function writeDefault(
  settings: PanelSettingsClient | undefined,
  id: string,
  setDesk: (value: string | undefined) => void,
): Promise<void> {
  if (settings === undefined) return
  const current = await settings.readPolicy()
  const { defaultWorkbenchId: gone, ...rest } = current
  void gone
  const next: PanelPolicy = { ...rest, defaultWorkbenchId: id }
  const written = await settings.writePolicy(next)
  setDesk(written.policy.defaultWorkbenchId)
}
