# Bounded recovery

Read this when a lost connection or a failed child can be retried.

One call has one attempt budget. Delays grow and then stop. Exhaustion fails that call. The registration stays, so the next call may try again. A crash loop inside one call does not.

## Example

```ts
export function onAttemptFailed(attempts: number, maxAttempts: number): 'retry' | 'stop' {
  if (attempts > maxAttempts) return 'stop'
  return 'retry'
}
```

Effect:

- After `maxAttempts`, this call fails and no timer is armed.
- The next public call starts a fresh budget.
- A child that connects and dies inside the stability window still consumes the budget of that call.

## Not this

```ts
export function onAttemptFailed(schedule: () => void): void {
  schedule()
}
```

Effect of the mistake: a crash loop restarts forever inside the same call.
