/** @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UiProvider } from '../../src/i18n/context'
import { en, zh } from '../../src/i18n/context'
import { EnvTable } from '../../src/blocks/env-table'
import { Gauge } from '../../src/blocks/gauge'
import { PageHeader } from '../../src/blocks/page-header'
import { Sparkline } from '../../src/blocks/sparkline'
import { StatCard } from '../../src/blocks/stat-card'
import { Terminal } from '../../src/blocks/terminal'
import { TestStepList } from '../../src/blocks/test-step-list'
import { Alert, AlertDescription, AlertTitle } from '../../src/components/alert'
import { Badge } from '../../src/components/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../src/components/card'
import { Checkbox } from '../../src/components/checkbox'
import { Input } from '../../src/components/input'
import { Kbd } from '../../src/components/kbd'
import { Progress } from '../../src/components/progress'
import { Separator } from '../../src/components/separator'
import { Skeleton } from '../../src/components/skeleton'
import { Spinner } from '../../src/components/spinner'
import { Textarea } from '../../src/components/textarea'
import {
  IlluAccessDenied,
  IlluBugFixing,
  IlluCodeReview,
  IlluDataProcessing,
  IlluEmpty,
  IlluLoading,
  IlluNoData,
  IlluPageNotFound,
  IlluSearch,
  IlluServerStatus,
} from '../../src/lib/illustrations'
import { CodeBlock } from '../../src/products/code-block'
import { FileDropzone } from '../../src/products/file-dropzone'
import { Gantt } from '../../src/products/gantt'
import { JsonViewer } from '../../src/products/json-viewer'
import { Kanban } from '../../src/products/kanban'
import { LogViewer } from '../../src/products/log-viewer'
import { Markdown } from '../../src/products/markdown'
import { SortableList } from '../../src/products/sortable-list'
import { Stepper, StepperItem } from '../../src/products/stepper'
import { Timeline } from '../../src/products/timeline'
import { TreeView } from '../../src/products/tree-view'
import { BooleanCell, NumberCell, StatusCell, TextCell } from '../../src/products/cells'

function callMessages(value: unknown): void {
  if (typeof value === 'function') {
    value(2, 4)
    return
  }
  if (typeof value === 'object' && value !== null) {
    for (const child of Object.values(value)) callMessages(child)
  }
}

describe('kit products', () => {
  it('calls every catalog function', () => {
    callMessages(en)
    callMessages(zh)
    expect(en.common.today.length).toBeGreaterThan(0)
    expect(zh.common.today.length).toBeGreaterThan(0)
  })

  it('renders the simple products', () => {
    const view = render(
      <UiProvider>
        <Gantt tasks={[]} />
        <Gantt tasks={[{ id: 'a', title: 'Plan', start: new Date(2026, 8, 1), end: new Date(2026, 8, 3) }]} />
        <Timeline items={[{ id: '1', title: 'Created', time: '09:00', description: 'now' }, { id: '2', title: 'Done' }]} />
        <TreeView nodes={[{ id: 'a', label: 'Root', children: [{ id: 'b', label: 'Child' }] }]} />
        <Stepper>
          <StepperItem title="Upload" status="completed" />
          <StepperItem title="Check" status="active" step={2} />
        </Stepper>
        <Stepper orientation="horizontal">
          <StepperItem title="Ship" />
        </Stepper>
        <JsonViewer value={{ n: 1, list: [true, null], note: 'ok' }} />
        <SortableList items={[{ id: 'a', label: 'A' }, { id: 'b', label: 'B' }]} />
        <Kanban
          columns={[{ id: 'todo', title: 'Todo' }]}
          cards={[{ id: 'c1', columnId: 'todo', title: 'Card' }]}
        />
        <LogViewer entries={[{ level: 'info', message: 'boot' }, { level: 'error', message: 'boom', timestamp: '12:00' }]} />
        <Markdown>{'# Title\n\n- one'}</Markdown>
        <CodeBlock code="pnpm test" language="bash" />
        <FileDropzone />
        <TextCell value="a" />
        <StatusCell value="open" />
        <BooleanCell value={true} />
        <NumberCell value={3} />
        <EnvTable title="Env" variables={[{ key: 'TOKEN', value: 'secret', environment: 'production', description: 'key' }]} />
        <Gauge value={40} />
        <Sparkline data={[{ value: 1 }, { value: 3 }]} />
        <StatCard title="Open" value="4" delta="+1" trend="up" />
        <PageHeader title="Apps" description="Local" actions={<button type="button">Add</button>} />
        <Terminal lines={['$ pnpm test', 'ok']} />
        <TestStepList steps={[{ id: '1', title: 'Boot', status: 'pass' }]} />
        <IlluServerStatus />
        <IlluAccessDenied />
        <IlluPageNotFound />
        <IlluSearch />
        <IlluDataProcessing />
        <IlluBugFixing />
        <IlluEmpty />
        <IlluNoData />
        <IlluLoading />
        <IlluCodeReview />
        <Alert><AlertTitle>Hi</AlertTitle><AlertDescription>There</AlertDescription></Alert>
        <Badge>New</Badge>
        <Card><CardHeader><CardTitle>Card</CardTitle></CardHeader><CardContent>Body</CardContent></Card>
        <Checkbox />
        <Input placeholder="Name" />
        <Textarea placeholder="Note" />
        <Kbd>⌘K</Kbd>
        <Progress value={30} />
        <Separator />
        <Skeleton />
        <Spinner />
      </UiProvider>,
    )
    expect(view.getByText('Plan')).toBeTruthy()
    view.unmount()
  })
})
