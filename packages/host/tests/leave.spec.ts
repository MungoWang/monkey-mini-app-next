import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'

import { leaveGuardSource } from '../src/compile/leave.ts'
import { renderRunnerDocument } from '../src/compile/runner.ts'

const page = 'http://127.0.0.1:9743/app/com.example.app'

interface LeaveWindow {
  document: {
    getElementById(id: string): { dispatchEvent(event: Event): void } | null
    createElement(tag: string): { textContent: string }
    body: { append(node: { textContent: string }): void }
  }
  open(url: string): null
  MouseEvent: new (type: string, init?: { bubbles?: boolean; cancelable?: boolean }) => Event & { defaultPrevented: boolean }
  Event: new (type: string, init?: { bubbles?: boolean; cancelable?: boolean }) => Event & { defaultPrevented: boolean }
  close(): void
}

describe('link leave', () => {
  it('opens external links and forms outside and leaves javascript and hashes', () => {
    const opened: string[] = []
    const dom = new JSDOM(`<!doctype html><body>
      <a id="out" href="https://example.com/x">Out</a>
      <a id="js" href="javascript:void(0)">Js</a>
      <a id="here" href="#part">Here</a>
      <a id="rel" href="./other">Rel</a>
      <a id="mail" href="mailto:a@b.c">Mail</a>
      <a id="ftp" href="ftp://files.example/a">Ftp</a>
      <form id="form" action="https://example.com/post" method="post"><button>Go</button></form>
    </body>`, { url: page, runScripts: 'dangerously' })
    const win = dom.window as unknown as LeaveWindow
    win.open = (url: string) => {
      opened.push(url)
      return null
    }
    const script = win.document.createElement('script')
    script.textContent = leaveGuardSource()
    win.document.body.append(script)
    const click = (id: string) => {
      const event = new win.MouseEvent('click', { bubbles: true, cancelable: true })
      win.document.getElementById(id)?.dispatchEvent(event)
      return event.defaultPrevented
    }
    expect(click('out')).toBe(true)
    expect(click('js')).toBe(false)
    expect(click('here')).toBe(false)
    expect(click('rel')).toBe(false)
    expect(click('mail')).toBe(true)
    expect(click('ftp')).toBe(true)
    const submit = new win.Event('submit', { bubbles: true, cancelable: true })
    win.document.getElementById('form')?.dispatchEvent(submit)
    expect(submit.defaultPrevented).toBe(true)
    expect(opened).toEqual(['https://example.com/x', 'mailto:a@b.c', 'https://example.com/post'])
    win.close()
  })

  it('includes the guard in the runner document', () => {
    const html = renderRunnerDocument({ appId: 'com.example.app', entry: '/api/app/com.example.app/ui/entry.js', style: '', appearance: 'dark' })
    expect(html.indexOf('function linkLeave')).toBeLessThan(html.indexOf('await import('))
  })
})
