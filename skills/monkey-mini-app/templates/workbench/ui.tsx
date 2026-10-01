import { useEffect, useState } from 'react'

import { AppCard, DashboardShell, LiveRefresh, PageHeader, useApp } from '@mohou/ui'

type FocusItem = { id: string; title: string; detail: string }
type AppItem = { id: string; name: string; description: string; version: string; acronym: string }
type Home = { focus: FocusItem[]; apps: AppItem[] }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isHome(value: unknown): value is Home {
  return isRecord(value) && Array.isArray(value.focus) && Array.isArray(value.apps)
}

export default function Ui() {
  // ⭐ key: this file is one homepage, not the workbench type.
  //          Design what is seen first, and design how other apps are arranged and entered.
  //          The aside is one sketch. A grid, tiles, or no kit is the same kind.
  const { call } = useApp()
  const [home, setHome] = useState<Home | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    const data = await call('home', {})
    if (isHome(data)) setHome(data)
  }

  useEffect(() => {
    const gate: { alive: boolean } = { alive: true }
    void (async () => {
      try {
        await load()
      } catch (caught) {
        if (gate.alive) setError(caught instanceof Error ? caught.message : String(caught))
      }
    })()
    return () => {
      gate.alive = false
    }
  }, [call])

  return (
    <DashboardShell
      header={
        <PageHeader
          title="今日"
          description="先看要处理的事，再用旁边的应用"
          actions={
            <LiveRefresh
              onTick={async () => {
                await load()
              }}
            />
          }
        />
      }
      main={
        <div className="flex flex-col gap-3 p-4">
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {(home?.focus ?? []).map(item => (
            <article key={item.id} className="rounded-xl border bg-card px-4 py-3">
              <h3 className="m-0 text-base font-semibold">{item.title}</h3>
              <p className="m-0 mt-1 text-sm text-muted-foreground">{item.detail}</p>
            </article>
          ))}
        </div>
      }
      aside={
        <div className="flex flex-col gap-3 p-3">
          <h2 className="m-0 text-xs font-semibold tracking-wide text-muted-foreground">应用</h2>
          {(home?.apps ?? []).map(app => (
            <AppCard
              key={app.id}
              type="list"
              app={app}
              openLabel="打开"
              onOpen={() => { void call('open', { appId: app.id, title: app.name }) }}
            />
          ))}
        </div>
      }
    />
  )
}
