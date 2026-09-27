declare module 'jsdom' {
  interface JsdomWindow {
    document: {
      querySelector(selector: string): { nodeType: number } | null
      createElement(tag: string): { textContent: string }
    }
    HTMLElement: new (...args: unknown[]) => unknown
    MessageEvent: new (type: string, init: { data: unknown; origin: string }) => object
    Response: new (body: null, init: { status: number }) => unknown
    parent: unknown
    fetch: (url: string, init: { body: string }) => Promise<unknown>
    dispatchEvent(event: object): boolean
    close(): void
  }

  export class JSDOM {
    constructor(html: string, options?: { url?: string; runScripts?: 'dangerously' | 'outside-only' })
    readonly window: JsdomWindow
  }
}
