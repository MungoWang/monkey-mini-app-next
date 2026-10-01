
import { Line, LineChart, YAxis } from 'recharts'

import { ChartContainer, type ChartConfig } from '@mohou/ui/components/chart'
import { cn } from '@mohou/ui/lib/utils'

const config = {
  value: { label: 'Value', color: 'var(--primary)' },
} satisfies ChartConfig

/**
 * Tiny inline trend line, no axes.
 * @when Trend inside a table row or KPI card.
 * @example
 * <Sparkline data={[{ value: 3 }, { value: 9 }, { value: 6 }]} />
 * @family Chart & data
 */
export function Sparkline({ data, className }: { data: { value: number }[]; className?: string }) {
  return (
    <ChartContainer config={config} className={cn('h-20 w-full', className)} data-testid="sparkline">
      <LineChart data={data}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line dataKey="value" type="monotone" stroke="var(--color-value)" strokeWidth={1.5} dot={false} />
      </LineChart>
    </ChartContainer>
  )
}
