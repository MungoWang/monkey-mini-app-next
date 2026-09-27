/** @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { Bar, BarChart } from 'recharts'
import { describe, expect, it } from 'vitest'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '../src/components/sidebar'
import { ChartContainer, ChartTooltipContent } from '../src/components/chart'

describe('kit surfaces that the gate counts', () => {
  it('renders the sidebar shell', () => {
    const view = render(
      <SidebarProvider>
        <Sidebar>
          <SidebarHeader>Head</SidebarHeader>
          <SidebarSeparator />
          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Group</SidebarGroupLabel>
              <SidebarGroupAction>Add</SidebarGroupAction>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton>Item</SidebarMenuButton>
                    <SidebarMenuAction />
                    <SidebarMenuBadge>2</SidebarMenuBadge>
                    <SidebarMenuSkeleton showIcon />
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>Sub</SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>
          <SidebarFooter>Foot</SidebarFooter>
          <SidebarRail />
        </Sidebar>
        <SidebarInset>
          <SidebarTrigger />
          <SidebarInput placeholder="Find" />
        </SidebarInset>
      </SidebarProvider>,
    )
    expect(view.getByText('Item')).toBeTruthy()
    view.unmount()
  })

  it('renders a chart container and tooltip', () => {
    const view = render(
      <ChartContainer config={{ v: { label: 'Value', color: 'red' }, w: { label: 'Wide', theme: { light: '#fff', dark: '#000' } } }}>
        <BarChart data={[{ v: 1, w: 2 }]}>
          <Bar dataKey="v" />
        </BarChart>
      </ChartContainer>,
    )
    render(
      <ChartContainer config={{ v: { label: 'Value', color: 'red' } }}>
        <ChartTooltipContent
          active
          label="v"
          payload={[{ dataKey: 'v', name: 'v', value: 1, color: 'red', graphicalItemId: 'v', payload: { v: 1 } }]}
        />
      </ChartContainer>,
    )
    expect(view.container.querySelector('[data-slot="chart"]')).toBeTruthy()
    view.unmount()
  })
})
