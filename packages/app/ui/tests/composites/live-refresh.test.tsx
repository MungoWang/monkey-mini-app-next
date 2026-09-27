/** @vitest-environment jsdom */
import { act, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { UiProvider } from '../../src/i18n/context'
import { LiveRefresh } from '../../src/composites/live-refresh'

function wrap(ui: ReactNode, locale: 'en' | 'zh' = 'en') {
  return render(<UiProvider locale={locale}>{ui}</UiProvider>)
}

describe('LiveRefresh', () => {
  it('starts off, enables without an immediate tick, and pauses', async () => {
    const onTick = vi.fn(async () => undefined)
    const persist = vi.fn(async () => true)
    const user = userEvent.setup()
    wrap(
      <LiveRefresh
        onTick={onTick}
        persistState={persist}
        defaultIntervalMs={30_000}
      />,
    )
    expect(screen.getByTestId('live-refresh')).toHaveAttribute('data-enabled', '0')
    expect(screen.getByText(/Tap to enable live refresh/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Tap to enable/i }))
    expect(screen.getByTestId('live-refresh')).toHaveAttribute('data-enabled', '1')
    expect(persist).toHaveBeenCalledWith({ enabled: true, intervalMs: 30_000 })
    expect(onTick).not.toHaveBeenCalled()
    expect(screen.getByText(/Every 30s/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /^LIVE/i }))
    expect(screen.getByTestId('live-refresh')).toHaveAttribute('data-paused', '1')
    expect(screen.getByText(/paused/i)).toBeInTheDocument()
  })

  it('changes interval anchored on lastAt and supports labels override', async () => {
    const onTick = vi.fn(async () => ({ status: 'ok' }))
    const onIntervalChange = vi.fn()
    const user = userEvent.setup()
    wrap(
      <LiveRefresh
        onTick={onTick}
        defaultEnabled
        defaultIntervalMs={10_000}
        intervals={[10_000, 30_000, 60_000]}
        onIntervalChange={onIntervalChange}
        labels={{ live: '实时', paused: '停了' }}
      />,
    )
    expect(screen.getByText(/实时/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /Every 10s/i }))
    await user.click(screen.getByRole('button', { name: /Every 30s/i }))
    expect(onIntervalChange).toHaveBeenCalledWith(30_000)
    expect(screen.getByText(/Every 30s/i)).toBeInTheDocument()
  })

  it('runs onTick when due and advances lastAt', async () => {
    vi.useFakeTimers()
    const onTick = vi.fn(async () => undefined)
    wrap(
      <LiveRefresh
        onTick={onTick}
        defaultEnabled
        defaultIntervalMs={10_000}
      />,
    )
    expect(onTick).not.toHaveBeenCalled()
    await act(async () => {
      vi.advanceTimersByTime(10_500)
      await Promise.resolve()
      await Promise.resolve()
    })
    expect(onTick).toHaveBeenCalled()
    vi.useRealTimers()
  })

  it('zh-CN chrome and custom minutes', async () => {
    const onIntervalChange = vi.fn()
    const user = userEvent.setup()
    wrap(
      <LiveRefresh
        onTick={async () => undefined}
        defaultEnabled
        defaultIntervalMs={30_000}
        onIntervalChange={onIntervalChange}
      />,
      'zh',
    )
    expect(screen.getByText(/每 30 秒/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /每 30 秒/ }))
    const input = screen.getByPlaceholderText('1.5')
    await user.clear(input)
    await user.type(input, '1.5{Enter}')
    expect(onIntervalChange).toHaveBeenCalledWith(90_000)
  })
})
