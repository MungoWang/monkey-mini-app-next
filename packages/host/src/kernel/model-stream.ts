/**
 * Turn a callback-shaped model call into a stream the method can `for await`.
 * Awaiting the same object waits for the final string. Iteration does not start a second call.
 */
export function modelStream<Event>(
  run: (emit: (event: Event) => void) => Promise<string>,
): AsyncIterable<Event> & Promise<string> {
  const queued: Event[] = []
  let waiting: { resolve: (step: IteratorResult<Event>) => void; reject: (error: unknown) => void } | undefined
  let settled = false
  let failure: unknown
  let started = false
  let resolveText: (value: string) => void
  let rejectText: (error: unknown) => void
  const text = new Promise<string>((resolve, reject) => {
    resolveText = resolve
    rejectText = reject
  })
  void text.catch(() => undefined)

  const push = (event: Event): void => {
    if (waiting !== undefined) {
      const resume = waiting
      waiting = undefined
      resume.resolve({ value: event, done: false })
      return
    }
    queued.push(event)
  }

  const finish = (): void => {
    const resume = waiting
    waiting = undefined
    if (resume === undefined) return
    if (failure instanceof Error) resume.reject(failure)
    else resume.resolve({ value: undefined, done: true })
  }

  const start = (): void => {
    if (started) return
    started = true
    run(push).then((value) => {
      settled = true
      resolveText(value)
      finish()
    }, (error: unknown) => {
      settled = true
      failure = error
      rejectText(error)
      finish()
    })
  }

  const iterator: AsyncIterator<Event> = {
    next() {
      start()
      const event = queued.shift()
      if (event !== undefined) return Promise.resolve({ value: event, done: false })
      if (failure !== undefined) return Promise.reject(failure instanceof Error ? failure : new Error('model stream failed'))
      if (settled) return Promise.resolve({ value: undefined, done: true })
      return new Promise((resolve, reject) => {
        waiting = { resolve, reject }
      })
    },
  }

  return {
    [Symbol.asyncIterator]() {
      start()
      return iterator
    },
    then(onFulfilled, onRejected) {
      start()
      return text.then(onFulfilled, onRejected)
    },
    catch(onRejected) {
      start()
      return text.catch(onRejected)
    },
    finally(onFinally) {
      start()
      return text.finally(onFinally)
    },
    [Symbol.toStringTag]: 'Promise',
  } as AsyncIterable<Event> & Promise<string>
}
