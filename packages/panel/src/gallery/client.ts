import type { GalleryApp } from './list.ts'

/** Host calls the view may make. No route string lives here. */
export interface PanelClient {
  list(): Promise<readonly GalleryApp[]>
  open(appId: string, title?: string): Promise<void>
  deleteApp(appId: string): Promise<void>
  reload?(appId: string): Promise<void>
  listTrash?(): Promise<readonly GalleryApp[]>
  undeleteApp?(appId: string): Promise<void>
}

/** A client failure the view can tell from an empty list. */
export class PanelClientError extends Error {
  readonly code: 'unreachable' | 'failed'

  /**
   * @param code - `unreachable` is not an empty gallery
   * @param message - human text
   */
  constructor(code: 'unreachable' | 'failed', message: string) {
    super(message)
    this.name = 'PanelClientError'
    this.code = code
  }
}
