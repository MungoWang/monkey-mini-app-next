import { describe, expect, it } from 'vitest'

import { admitWindowOrigin, openPanelWindow, panelWindowCommand, windowBinaryName, windowBinaryPath } from '../src/window.ts'

describe('panel window', () => {
  it('launches the Tauri binary with a loopback origin', () => {
    expect(windowBinaryName('darwin')).toBe('mini-app-window')
    expect(windowBinaryName('win32')).toBe('mini-app-window.exe')
    expect(() => windowBinaryName('linux')).toThrow('panel window is not implemented on linux')
    expect(panelWindowCommand('http://127.0.0.1:9743', 'darwin', '/opt/mini-app-window')).toEqual({
      command: '/opt/mini-app-window',
      args: ['http://127.0.0.1:9743'],
    })
    expect(panelWindowCommand('http://127.0.0.1:9743', 'win32', 'C:\\mini-app-window.exe')).toEqual({
      command: 'C:\\mini-app-window.exe',
      args: ['http://127.0.0.1:9743'],
    })
    expect(admitWindowOrigin('http://localhost:9')).toBe('http://localhost:9')
    expect(() => admitWindowOrigin('not a url')).toThrow('panel window origin is invalid')
    expect(() => panelWindowCommand('https://127.0.0.1:1', 'darwin', '/opt/mini-app-window')).toThrow('must be http')
    expect(() => panelWindowCommand('http://example.com:1', 'darwin', '/opt/mini-app-window')).toThrow('must be loopback')
    expect(() => panelWindowCommand('http://127.0.0.1:1/panel', 'darwin', '/opt/mini-app-window')).toThrow('must not include a path')
    expect(() => panelWindowCommand('http://127.0.0.1:1?x=1', 'darwin', '/opt/mini-app-window')).toThrow('must not include a path')
    expect(windowBinaryPath('darwin')).toContain('mini-app-window')
    const seen: { command: string; args: readonly string[] }[] = []
    openPanelWindow('http://127.0.0.1:9', (command, args) => {
      seen.push({ command, args })
      return { unref() {} } as never
    }, '/opt/mini-app-window')
    expect(seen).toEqual([panelWindowCommand('http://127.0.0.1:9', process.platform, '/opt/mini-app-window')])
  })
})
