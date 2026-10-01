
import { Calendar } from '@mohou/ui/components/calendar'
import { cn } from '@mohou/ui/lib/utils'

/**
 * Compact month grid, day cell only.
 * @when Inside a popover or sidebar. Full page with events → `EventCalendar`.
 * @example
 * <MiniCalendar value={d} onChange={(v) => set(v)} />
 * @family Calendar & date
 */
export function MiniCalendar({
  value,
  onChange,
  className,
}: {
  value?: Date
  onChange?: (date: Date | undefined) => void
  className?: string
}) {
  return (
    <Calendar
      mode="single"
      {...value === undefined ? {} : { selected: value }}
      {...onChange === undefined ? {} : { onSelect: onChange }}
      data-testid="mini-calendar"
      className={cn('rounded-xl border [--cell-size:--spacing(7)]', className)}
    />
  )
}
