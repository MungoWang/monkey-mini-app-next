import type { ReactNode } from 'react'
import type { AppListItem } from '@mini-app/contract'

import { AppCard, type AppCardStyle } from './app-card.tsx'

/**
 * The builtin library body. A workbench app does not render this.
 * `openApp` asks the panel to add a tab. The component does not write policy.
 */
export function WorkbenchLibrary(props: {
  readonly apps: readonly AppListItem[]
  readonly cardStyle: AppCardStyle
  readonly openLabel: string
  readonly openAppIds?: readonly string[]
  openApp(appId: string, title?: string): void
}): ReactNode {
  const grid = props.cardStyle === 'list' ? 'flex flex-col gap-3' : 'mma-grid'
  return (
    <div className={grid}>
      {props.apps.map((app, index) => {
        const featured = props.cardStyle === 'glass' && index === 0
        return (
          <div key={app.id} className={featured ? 'mma-feature min-w-0' : 'min-w-0'}>
            <AppCard
              type={props.cardStyle}
              app={app}
              open={props.openAppIds?.includes(app.id) === true}
              openLabel={props.openLabel}
              extra={featured ? { featured: true } : {}}
              onOpen={() => { props.openApp(app.id, app.name) }}
            />
          </div>
        )
      })}
    </div>
  )
}
