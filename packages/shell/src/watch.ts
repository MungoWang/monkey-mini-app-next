import type { HostSession } from '@mini-app/host'

import { applyHostEvent, type FrameBridge, type PanelBridge } from './bridge.ts'

/**
 * Send host events to the panel, and frame events through one bridge.
 * Reload and eval are not posted twice. Does not open a window.
 * The caller posts the theme message before any frame event.
 * @param host - a booted host
 * @param panel - panel commands
 * @param frame - frame bridge, absent when no iframe is mounted
 * @returns stop watching
 */
export function watchHost(host: HostSession, panel: PanelBridge, frame?: FrameBridge): () => void {
  const stopPanel = host.author.hostEvents.subscribe((event) => {
    if (event.type === 'app:reload' || event.type === 'app:eval') {
      if (frame === undefined) {
        panel.unavailable(event.appId)
        if (event.type === 'app:eval') host.author.views.absent(event.appId)
      }
      return
    }
    applyHostEvent(event, panel)
  })
  const stopFrame = frame === undefined
    ? () => undefined
    : host.bindFrame((message) => {
      frame.post(message)
    })
  return () => {
    stopPanel()
    stopFrame()
  }
}
