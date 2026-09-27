---
status: shape-locked
progress: settled
updated: 2026-09-23
---

# Heat

Layer: [Host](README.md). Index: [features.md](../features.md).

- Owner: Host. The committed record is `activity.json` in the runtime root. It is not source history, not an app file, and not `host.json`.
- Input: an open of a registered app. The time is the time of that open.
- Output: `apps.<appId>` is `{ lastOpenedAt, openCount }`. The count increases by one. `lastOpenedAt` becomes the later of the stored time and this open. An app that has never been opened is absent. A missing file is no activity. The owner list copies that object onto the app as `activity`. There is no separate activity route.
- Failure: a file that is not this document emits `activity-invalid` and is left in place. That is not an empty map. A present file that cannot be read emits `activity-unreadable`. A failed update does not publish `app:open`. An unknown app does not change the file.
- Non-goals: a log of every open; a score, a band, a rank, or a card; reading tags or a recommendation; a server.

```ts
interface HeatSample {
  readonly appId: string
  readonly openedAt: string
}

interface HeatValue {
  readonly lastOpenedAt: string
  readonly openCount: number
}

type HeatSnapshot = Readonly<Record<string, HeatValue>>

function heat(samples: readonly HeatSample[]): HeatSnapshot
```

`heat` folds samples the caller already has. It does not read the clock or the disk. The file stores the folded value, not the samples.

## Implementation

Role: provider, inside Host. `readActivity` and `recordOpen` own the file. `mini_app_open` calls `recordOpen` after the app is found, then publishes `app:open`. `heat` remains a pure function. No package is split out for this file.
