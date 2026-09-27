/** @vitest-environment jsdom */
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { UiProvider } from '../../src/i18n/context'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
  AttachmentTrigger,
} from '../../src/components/attachment'
import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '../../src/components/breadcrumb'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '../../src/components/combobox'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '../../src/components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../src/components/dropdown-menu'
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
} from '../../src/components/field'
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from '../../src/components/item'
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '../../src/components/menubar'
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '../../src/components/navigation-menu'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../src/components/pagination'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireError,
  QuestionnaireInput,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSkip,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '../../src/components/questionnaire'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../src/components/select'
import { Toaster, toast } from '../../src/components/toast'
import { EventCalendar } from '../../src/products/event-calendar'
import type { IEvent, IUser } from '../../src/products/full-calendar/interfaces'
import type { TCalendarView } from '../../src/products/full-calendar/types'

const user: IUser = { id: 'ada', name: 'Ada', picturePath: null }
const row: IEvent = {
  id: 1,
  startDate: '2026-09-16T09:00:00.000Z',
  endDate: '2026-09-18T11:00:00.000Z',
  title: 'Meet',
  color: 'blue',
  description: 'Talk',
  user,
}

describe('kit chrome', () => {
  it('renders each calendar view', () => {
    const views: TCalendarView[] = ['day', 'week', 'month', 'year', 'agenda']
    for (const view of views) {
      const rendered = render(
        <EventCalendar events={[row]} users={[user]} view={view} date={new Date(2026, 8, 16)} />,
      )
      expect(rendered.getByTestId('event-calendar')).toBeTruthy()
      rendered.unmount()
    }
  })

  it('renders form and navigation chrome', () => {
    toast.add({ title: 'Saved', description: 'Ok' })
    const view = render(
      <UiProvider>
        <Toaster />
        <FieldSet>
          <FieldLegend>Group</FieldLegend>
          <FieldGroup>
            <Field>
              <FieldLabel>Name</FieldLabel>
              <FieldTitle>Name</FieldTitle>
              <FieldDescription>Who</FieldDescription>
              <FieldError>Required</FieldError>
            </Field>
            <FieldSeparator>or</FieldSeparator>
          </FieldGroup>
        </FieldSet>
        <ItemGroup>
          <Item>
            <ItemHeader>Head</ItemHeader>
            <ItemMedia>M</ItemMedia>
            <ItemContent>
              <ItemTitle>Title</ItemTitle>
              <ItemDescription>Body</ItemDescription>
            </ItemContent>
            <ItemActions><button type="button">Go</button></ItemActions>
            <ItemFooter>Foot</ItemFooter>
          </Item>
          <ItemSeparator />
        </ItemGroup>
        <AttachmentGroup>
          <Attachment>
            <AttachmentTrigger>File</AttachmentTrigger>
            <AttachmentMedia>F</AttachmentMedia>
            <AttachmentContent>
              <AttachmentTitle>Notes</AttachmentTitle>
              <AttachmentDescription>txt</AttachmentDescription>
            </AttachmentContent>
            <AttachmentActions><AttachmentAction>Open</AttachmentAction></AttachmentActions>
          </Attachment>
        </AttachmentGroup>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><BreadcrumbLink href="/">Home</BreadcrumbLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbEllipsis />
            <BreadcrumbItem><BreadcrumbPage>Here</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Pagination>
          <PaginationContent>
            <PaginationItem><PaginationPrevious href="/" /></PaginationItem>
            <PaginationItem><PaginationLink href="/">1</PaginationLink></PaginationItem>
            <PaginationItem><PaginationEllipsis /></PaginationItem>
            <PaginationItem><PaginationNext href="/" /></PaginationItem>
          </PaginationContent>
        </Pagination>
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger>More</NavigationMenuTrigger>
              <NavigationMenuLink href="/">Docs</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
        <Menubar>
          <MenubarMenu>
            <MenubarTrigger>File</MenubarTrigger>
            <MenubarContent>
              <MenubarItem>New</MenubarItem>
              <MenubarSeparator />
            </MenubarContent>
          </MenubarMenu>
        </Menubar>
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Acts</DropdownMenuLabel>
            <DropdownMenuItem>One</DropdownMenuItem>
            <DropdownMenuSeparator />
          </DropdownMenuContent>
        </DropdownMenu>
        <Select>
          <SelectTrigger><SelectValue placeholder="Pick" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="a">A</SelectItem>
          </SelectContent>
        </Select>
        <Combobox>
          <ComboboxTrigger><ComboboxValue placeholder="Find" /></ComboboxTrigger>
          <ComboboxInput />
          <ComboboxContent>
            <ComboboxList>
              <ComboboxItem value="a">A</ComboboxItem>
              <ComboboxEmpty>None</ComboboxEmpty>
            </ComboboxList>
          </ComboboxContent>
        </Combobox>
        <Drawer>
          <DrawerTrigger>Open</DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Title</DrawerTitle>
              <DrawerDescription>Body</DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>Foot</DrawerFooter>
          </DrawerContent>
        </Drawer>
        <Questionnaire>
          <QuestionnaireProgress />
          <QuestionnaireItem name="name">
            <QuestionnaireTitle>Name</QuestionnaireTitle>
            <QuestionnaireDescription>Who</QuestionnaireDescription>
            <QuestionnaireInput />
            <QuestionnaireError>Required</QuestionnaireError>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="a">
                A
                <QuestionnaireChoiceDescription>one</QuestionnaireChoiceDescription>
              </QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
          <QuestionnaireActions>
            <QuestionnairePrevious />
            <QuestionnaireSkip />
            <QuestionnaireNext />
            <QuestionnaireSubmit />
          </QuestionnaireActions>
        </Questionnaire>
      </UiProvider>,
    )
    expect(view.getAllByText('Name').length).toBeGreaterThan(0)
    view.unmount()
  })
})
