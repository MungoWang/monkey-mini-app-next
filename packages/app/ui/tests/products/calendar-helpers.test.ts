import { enUS } from 'date-fns/locale'
import { describe, expect, it } from 'vitest'

import type { IEvent, IUser } from '../../src/products/full-calendar/interfaces'
import type { TCalendarView, TEventColor } from '../../src/products/full-calendar/types'
import {
  calculateMonthEventPositions,
  formatTime,
  getBgColor,
  getCalendarCells,
  getColorClass,
  getEventBlockStyle,
  getEventsCount,
  getEventsForDay,
  getEventsForMonth,
  getEventsForWeek,
  getEventsForYear,
  getFirstLetters,
  getMonthCellEvents,
  getWeekDates,
  groupEvents,
  navigateDate,
  rangeText,
  toCapitalize,
} from '../../src/products/full-calendar/helpers'

const user: IUser = { id: 'ada', name: 'Ada Lovelace', picturePath: null }

function event(id: number, start: string, end: string, color: TEventColor = 'blue'): IEvent {
  return { id, startDate: start, endDate: end, title: 'Meet', color, description: '', user }
}

const views: TCalendarView[] = ['month', 'week', 'day', 'year', 'agenda']

describe('calendar helpers', () => {
  it('formats a range for every view and rejects an unknown view', () => {
    const date = new Date(2026, 8, 16)
    for (const view of views) {
      expect(rangeText(view, date).length).toBeGreaterThan(0)
      expect(rangeText(view, date, { locale: enUS })).toContain('2026')
    }
    expect(rangeText('nope' as TCalendarView, date)).toBe('Error while formatting')
    expect(rangeText('nope' as TCalendarView, date, { formatError: 'bad' })).toBe('bad')
  })

  it('moves a date forward and back for every view', () => {
    const date = new Date(2026, 8, 16)
    for (const view of views) {
      expect(navigateDate(date, view, 'next').getTime()).toBeGreaterThan(date.getTime())
      expect(navigateDate(date, view, 'previous').getTime()).toBeLessThan(date.getTime())
    }
  })

  it('counts, groups, and places events', () => {
    const day = new Date(2026, 8, 16)
    const rows = [
      event(1, '2026-09-16T09:00:00', '2026-09-16T10:00:00'),
      event(2, '2026-09-16T09:30:00', '2026-09-16T11:00:00'),
      event(3, '2026-09-16T11:00:00', '2026-09-16T12:00:00'),
      event(4, 'not-a-date', 'not-a-date'),
    ]
    for (const view of views) expect(getEventsCount(rows, day, view)).toBeGreaterThanOrEqual(0)
    const groups = groupEvents(rows.slice(0, 3))
    expect(groups.length).toBeGreaterThan(0)
    expect(groupEvents([])).toEqual([])
    const block = getEventBlockStyle(rows[0]!, day, 0, 2)
    expect(block.width).toBe('50%')
    expect(getEventBlockStyle(event(9, '2026-09-15T22:00:00', '2026-09-16T01:00:00'), day, 1, 2).top).toBe('0%')
  })

  it('builds a month grid and assigns at most three lanes', () => {
    const date = new Date(2026, 8, 1)
    const cells = getCalendarCells(date)
    expect(cells.length % 7).toBe(0)
    expect(cells.some(cell => cell.currentMonth)).toBe(true)
    const exact = getCalendarCells(new Date(2026, 1, 1))
    expect(exact.length % 7).toBe(0)
    const multi = [
      event(1, '2026-08-30T00:00:00', '2026-09-20T00:00:00', 'red'),
      event(2, '2026-09-01T00:00:00', '2026-09-10T00:00:00', 'green'),
      event(3, '2026-09-01T00:00:00', '2026-09-03T00:00:00', 'yellow'),
      event(4, '2026-09-01T00:00:00', '2026-09-02T00:00:00', 'purple'),
    ]
    const single = [event(5, '2026-09-16T09:00:00', '2026-09-16T10:00:00', 'orange')]
    const positions = calculateMonthEventPositions(multi, single, date)
    expect(positions[1]).toBe(0)
    expect(positions[4]).toBeUndefined()
    const placed = getMonthCellEvents(new Date(2026, 8, 16), [...multi, ...single], positions)
    expect(placed[0]?.isMultiDay).toBe(true)
    expect(getMonthCellEvents(new Date(2026, 8, 16), single, {}).some(row => row.position === -1)).toBe(true)
  })

  it('formats time, initials, and the events visible in each range', () => {
    expect(formatTime('nope', true)).toBe('')
    expect(formatTime(new Date(2026, 8, 16, 15, 4), true)).toBe('15:04')
    expect(formatTime('2026-09-16T15:04:00', false)).toContain('3:04')
    expect(getFirstLetters('')).toBe('')
    expect(getFirstLetters('ada')).toBe('A')
    expect(getFirstLetters('ada lovelace')).toBe('AL')
    const rows = [
      event(1, '2026-09-16T09:00:00', '2026-09-16T10:00:00'),
      event(2, '2026-09-14T09:00:00', '2026-09-18T10:00:00'),
      event(3, 'bad', 'bad'),
    ]
    const day = new Date(2026, 8, 16)
    expect(getEventsForDay(rows, day).length).toBeGreaterThan(0)
    expect(getEventsForDay(rows, day, true).every(row => row.startDate !== row.endDate)).toBe(true)
    expect(getEventsForDay(rows, new Date(2026, 8, 14), true)).toHaveLength(1)
    expect(getEventsForDay(rows, new Date(2026, 8, 18), true)).toHaveLength(1)
    expect(getWeekDates(day)).toHaveLength(7)
    expect(getEventsForWeek(rows, day).some(row => row.id === 3)).toBe(false)
    expect(getEventsForMonth(rows, day).some(row => row.id === 1)).toBe(true)
    expect(getEventsForYear([], day)).toEqual([])
    expect(getEventsForYear(rows, new Date(Number.NaN))).toEqual([])
    expect(getEventsForYear(rows, day).some(row => row.id === 3)).toBe(false)
    expect(getColorClass('blue')).toContain('blue')
    expect(getColorClass('nope')).toBe('')
    expect(getBgColor('red')).toContain('red')
    expect(getBgColor('nope')).toBe('')
    expect(toCapitalize('')).toBe('')
    expect(toCapitalize('month')).toBe('Month')
  })
})
