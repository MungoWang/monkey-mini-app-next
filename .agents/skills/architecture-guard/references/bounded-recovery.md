# Bounded recovery

Read this when a lost connection or a failed child can be retried.

One outage has one attempt budget. Delays grow and then stop. Exhaustion unregisters the capability and stops. A connection that stays up past the stability window starts a fresh budget. A crash loop does not.

## Example

```ts
export function onAttemptFailed(attempts: number, maxAttempts: number, unregister: () => void, schedule: () => void): void {
  if (attempts > maxAttempts) {
    unregister()
    return
  }
  schedule()
}
```

Effect:

- After `maxAttempts`, the name is gone and no timer is armed. The next retry requires an explicit reload.
- A child that connects and dies inside the stability window still consumes the budget.
- The retry timer is unref'd. Dispose clears it. See [dispose.md](dispose.md).

## Not this

```ts
export function onAttemptFailed(schedule: () => void): void {
  schedule()
}
```

Effect of the mistake: a crash loop restarts forever. The process never reaches the unregistered state.
