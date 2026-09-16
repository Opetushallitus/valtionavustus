import { expect, test } from '@playwright/test'
import { createHakuSaveQueue } from '../../../va-virkailija/web/va/hakujen-hallinta-page/hakuSaveQueue'

const originalSetTimeout = global.setTimeout
const originalClearTimeout = global.clearTimeout
const originalNow = Date.now
const originalConsoleError = console.error
let now = 0
let timerId = 0
const timers = new Map<number, { at: number; callback: () => void }>()

function tick(milliseconds: number) {
  const target = now + milliseconds
  while (true) {
    const next = [...timers.entries()]
      .filter(([, timer]) => timer.at <= target)
      .sort(([, a], [, b]) => a.at - b.at)[0]
    if (!next) break
    const [id, timer] = next
    now = timer.at
    timers.delete(id)
    timer.callback()
  }
  now = target
}

function deferredSave() {
  let resolve!: () => void
  let reject!: (error: Error) => void
  const promise = new Promise<void>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

test.beforeEach(() => {
  now = 0
  timerId = 0
  timers.clear()
  Date.now = () => now
  global.setTimeout = ((callback: () => void, delay = 0) => {
    const id = ++timerId
    timers.set(id, { at: now + delay, callback })
    return id
  }) as unknown as typeof setTimeout
  global.clearTimeout = ((id: number) => {
    timers.delete(id)
  }) as unknown as typeof clearTimeout
})

test.afterEach(() => {
  global.setTimeout = originalSetTimeout
  global.clearTimeout = originalClearTimeout
  Date.now = originalNow
  console.error = originalConsoleError
})

test('debounces edits and saves only the latest values', async () => {
  const queue = createHakuSaveQueue()
  const saved: string[] = []
  queue.schedule(1, 500, async () => {
    saved.push('old date')
  })
  tick(400)
  queue.schedule(1, 500, async () => {
    saved.push('new date')
  })
  tick(499)
  expect(saved).toEqual([])
  tick(1)
  expect(saved).toEqual(['new date'])
})

test('serializes saves and coalesces edits made while a request is in flight', async () => {
  const queue = createHakuSaveQueue()
  const saved: string[] = []
  const first = deferredSave()
  queue.schedule(1, 100, async () => {
    saved.push('first')
    await first.promise
  })
  tick(100)
  queue.schedule(1, 100, async () => {
    saved.push('intermediate')
  })
  tick(100)
  queue.schedule(1, 100, async () => {
    saved.push('latest')
  })
  tick(100)
  expect(saved).toEqual(['first'])
  first.resolve()
  await first.promise
  await Promise.resolve()
  expect(saved).toEqual(['first', 'latest'])
})

test('waits for the debounce deadline when the in-flight save finishes first', async () => {
  const queue = createHakuSaveQueue()
  const first = deferredSave()
  const saved: string[] = []
  queue.schedule(1, 100, () => first.promise)
  tick(100)
  queue.schedule(1, 500, async () => {
    saved.push('latest')
  })
  first.resolve()
  await first.promise
  await Promise.resolve()
  tick(499)
  expect(saved).toEqual([])
  tick(1)
  expect(saved).toEqual(['latest'])
})

test('publishing replaces an older debounce and saves later edits at the publishing deadline', async () => {
  const queue = createHakuSaveQueue()
  const saved: string[] = []
  queue.schedule(1, 500, async () => {
    saved.push('draft')
  })
  tick(50)
  queue.schedule(1, 100, async () => {
    saved.push('published')
  })
  tick(50)
  queue.schedule(1, 500, async () => {
    saved.push('published with updated date')
  })
  tick(49)
  expect(saved).toEqual([])
  tick(1)
  expect(saved).toEqual(['published with updated date'])
  tick(1000)
  expect(saved).toEqual(['published with updated date'])
})

test('saves different grants independently while another grant has an in-flight request', async () => {
  const queue = createHakuSaveQueue()
  const first = deferredSave()
  const saved: number[] = []
  queue.schedule(1, 100, async () => {
    saved.push(1)
    await first.promise
  })
  queue.schedule(2, 500, async () => {
    saved.push(2)
  })
  tick(100)
  queue.schedule(3, 100, async () => {
    saved.push(3)
  })
  tick(400)
  expect(saved).toEqual([1, 3, 2])
  first.resolve()
  await first.promise
})

test('reports a rejected save and still runs the queued save', async () => {
  const queue = createHakuSaveQueue()
  const first = deferredSave()
  const saved: string[] = []
  const error = new Error('connection lost')
  const reportedErrors: unknown[][] = []
  console.error = (...args: unknown[]) => {
    reportedErrors.push(args)
  }
  queue.schedule(1, 100, () => first.promise)
  tick(100)
  queue.schedule(1, 100, async () => {
    saved.push('latest')
  })
  tick(100)
  first.reject(error)
  await Promise.resolve()
  await Promise.resolve()
  expect(reportedErrors).toHaveLength(1)
  expect(reportedErrors[0]).toContain(error)
  expect(saved).toEqual(['latest'])
})
