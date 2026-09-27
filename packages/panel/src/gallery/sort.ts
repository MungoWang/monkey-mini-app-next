import type { GalleryApp } from './list.ts'

/** Built-in orders for the workbench app list. */
export const appSortings = {
  createdTime: 'created-time',
  updatedTime: 'updated-time',
  heat: 'heat',
} as const

export type AppSorting = typeof appSortings[keyof typeof appSortings]

export type SortDirection = 'asc' | 'desc'

/** The heat fields this sort reads. An id that is absent counts as zero opens. */
export interface SortHeat {
  readonly lastOpenedAt: string
  readonly openCount: number
}

/**
 * Return a new array. Does not write the source.
 * Heat uses `openCount`, then `lastOpenedAt`. A missing time sorts last in both directions.
 * @param apps - the list to order
 * @param sorting - created time, updated time, or heat
 * @param direction - `asc` or `desc`
 * @param heat - heat snapshot; ignored by the time sorts
 */
export function sortApps(
  apps: readonly GalleryApp[],
  sorting: AppSorting,
  direction: SortDirection,
  heat: Readonly<Record<string, SortHeat>>,
): GalleryApp[] {
  return apps.map((app, index) => ({ app, index })).sort((left, right) => {
    const compared = sorting === appSortings.heat
      ? compareHeat(left.app.id, right.app.id, heat, direction)
      : compareTime(timeOf(left.app, sorting), timeOf(right.app, sorting), direction)
    return compared === 0 ? left.index - right.index : compared
  }).map(row => row.app)
}

function timeOf(app: GalleryApp, sorting: AppSorting): string | undefined {
  return sorting === appSortings.createdTime ? app.createdAt : app.updatedAt
}

function compareHeat(
  leftId: string,
  rightId: string,
  heat: Readonly<Record<string, SortHeat>>,
  direction: SortDirection,
): number {
  const left = heat[leftId]
  const right = heat[rightId]
  const byCount = compareNumber(left?.openCount ?? 0, right?.openCount ?? 0, direction)
  if (byCount !== 0) return byCount
  return compareTime(left?.lastOpenedAt, right?.lastOpenedAt, direction)
}

function compareNumber(left: number, right: number, direction: SortDirection): number {
  if (left === right) return 0
  const order = left < right ? -1 : 1
  return direction === 'asc' ? order : -order
}

function compareTime(left: string | undefined, right: string | undefined, direction: SortDirection): number {
  if (left === undefined && right === undefined) return 0
  if (left === undefined) return 1
  if (right === undefined) return -1
  if (left === right) return 0
  const order = left < right ? -1 : 1
  return direction === 'asc' ? order : -order
}
