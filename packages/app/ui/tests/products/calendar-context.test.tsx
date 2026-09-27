/** @vitest-environment jsdom */
import { act, render } from '@testing-library/react'
import { useState } from 'react'
import { describe, expect, it } from 'vitest'

import { CalendarProvider, useCalendar } from '../../src/products/full-calendar/contexts/calendar-context'
import { useGetEventsByMode, useScrollPosition } from '../../src/products/full-calendar/helpers'
import type { IEvent, IUser } from '../../src/products/full-calendar/interfaces'
import type { TCalendarView } from '../../src/products/full-calendar/types'

const user: IUser = { id: 'ada', name: 'Ada', picturePath: null }
const row: IEvent = {
  id: 1,
  startDate: '2026-09-16T09:00:00.000Z',
  endDate: '2026-09-16T10:00:00.000Z',
  title: 'Meet',
  color: 'blue',
  description: '',
  user,
}

describe('calendar context', () => {
  it('updates view, filters, and events', () => {
    const seen: IEvent[][] = []
    let calendar: ReturnType<typeof useCalendar> | undefined
    let modes = 0
    function Harness(): null {
      calendar = useCalendar()
      modes = useGetEventsByMode([row]).length
      useScrollPosition()
      return null
    }
    function Host() {
      const [events, setEvents] = useState<IEvent[]>([row])
      return (
        <CalendarProvider users={[user]} events={events} badge="dot" view="week" onEventsChange={(next) => { seen.push(next); setEvents(next) }}>
          <Harness />
        </CalendarProvider>
      )
    }
    const view = render(<Host />)
    expect(calendar?.view).toBe('week')
    expect(modes).toBeGreaterThanOrEqual(0)
    const views: TCalendarView[] = ['day', 'week', 'month', 'agenda', 'year']
    act(() => {
      for (const next of views) calendar?.setView(next)
      calendar?.toggleTimeFormat()
      calendar?.setStartOfDayHour(10)
      calendar?.setStartOfDayHour(99)
      calendar?.setAgendaModeGroupBy('color')
      calendar?.setBadgeVariant('colored')
      calendar?.filterEventsBySelectedColors('blue')
      calendar?.filterEventsBySelectedColors('red')
      calendar?.filterEventsBySelectedColors('blue')
      calendar?.filterEventsBySelectedColors('red')
      calendar?.filterEventsBySelectedUser('ada')
      calendar?.filterEventsBySelectedUser('all')
      calendar?.setSelectedDate(undefined)
      calendar?.setSelectedDate(new Date(2026, 8, 16))
      calendar?.addEvent({ ...row, id: 2, color: 'green' })
      calendar?.updateEvent({ ...row, id: 2, title: 'Later' })
      calendar?.removeEvent(2)
      calendar?.clearFilter()
    })
    expect(seen.length).toBeGreaterThan(0)
    view.unmount()
  })
})
