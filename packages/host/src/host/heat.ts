/** One recorded open. The caller has already read it. */
export interface HeatSample {
  readonly appId: string
  readonly openedAt: string
}

/** Observed use for one app. Absent means no sample, not zero. */
export interface HeatValue {
  readonly lastOpenedAt: string
  readonly openCount: number
}

/** Heat keyed by app id. An empty map means the caller passed no samples. */
export type HeatSnapshot = Readonly<Record<string, HeatValue>>

/**
 * Fold open samples into heat. The latest `openedAt` string wins.
 * This function does not read the clock or the disk.
 * @param samples - opens the caller already read
 */
export function heat(samples: readonly HeatSample[]): HeatSnapshot {
  const snapshot: Record<string, HeatValue> = {}
  for (const sample of samples) {
    const previous = snapshot[sample.appId]
    if (previous === undefined) {
      snapshot[sample.appId] = { lastOpenedAt: sample.openedAt, openCount: 1 }
      continue
    }
    snapshot[sample.appId] = {
      lastOpenedAt: sample.openedAt > previous.lastOpenedAt ? sample.openedAt : previous.lastOpenedAt,
      openCount: previous.openCount + 1,
    }
  }
  return snapshot
}
