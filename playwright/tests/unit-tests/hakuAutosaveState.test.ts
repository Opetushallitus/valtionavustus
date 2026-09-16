import { expect, test } from '@playwright/test'
import type { VirkailijaAvustushaku } from '../../../va-virkailija/web/va/hakujen-hallinta-page/hakuReducer'

let reducer: typeof import('../../../va-virkailija/web/va/hakujen-hallinta-page/hakuReducer').default

test.beforeAll(() => {
  // The browser module reads the configured debounce delay during initialization.
  Object.defineProperty(globalThis, 'window', { value: {}, configurable: true })
  reducer = require('../../../va-virkailija/web/va/hakujen-hallinta-page/hakuReducer').default
})

test.afterAll(() => {
  Reflect.deleteProperty(globalThis, 'window')
})

function grant(id: number): VirkailijaAvustushaku {
  return {
    id,
    status: 'draft',
    phase: 'unpublished',
    content: { duration: { start: '2026-01-01T00:00:00Z', end: '2026-12-31T21:59:59.999Z' } },
    decision: { updatedAt: 'old' },
    projects: [{ id: 1 }],
  } as VirkailijaAvustushaku
}

function initialState() {
  return reducer(undefined, {
    type: 'haku/fetchInitialState/fulfilled',
    payload: { hakuList: [grant(1), grant(2)] },
  })
}

function schedule(state: ReturnType<typeof reducer>, id: number, revision: string) {
  return reducer(state, {
    type: 'haku/startAutoSave/pending',
    meta: { arg: id, requestId: revision },
  })
}

function complete(
  state: ReturnType<typeof reducer>,
  haku: VirkailijaAvustushaku,
  revision: string
) {
  return reducer(state, {
    type: 'haku/saveHaku/fulfilled',
    payload: haku,
    meta: { arg: { haku, revision } },
  })
}

test('a stale response preserves newer publication and deadline edits and pending status', () => {
  const old = grant(1)
  const edited = {
    ...old,
    status: 'published' as const,
    content: {
      ...old.content,
      duration: { ...old.content.duration, end: '2026-09-17T20:59:59.999Z' },
    },
  }
  let state = schedule(initialState(), 1, 'old')
  state = reducer(state, { type: 'haku/updateAvustushaku', payload: edited })
  state = schedule(state, 1, 'new')
  state = complete(state, old, 'old')
  expect(state.initialData).toMatchObject({ data: { hakuList: [edited, grant(2)] } })
  expect(state.saveStatus.saveInProgress).toBe(true)
})

test('a stale failure does not end or fail the newer pending save', () => {
  let state = schedule(initialState(), 1, 'old')
  state = schedule(state, 1, 'new')
  state = reducer(state, {
    type: 'haku/saveHaku/rejected',
    payload: 'unexpected-save-error',
    meta: { arg: { haku: grant(1), revision: 'old' } },
  })
  expect(state.saveStatus.saveInProgress).toBe(true)
  expect(state.saveStatus.serverError).toBeFalsy()
})

test('saving one grant does not mark another pending grant as saved', () => {
  let state = schedule(initialState(), 1, 'first')
  state = schedule(state, 2, 'second')
  state = complete(state, grant(1), 'first')
  expect(state.saveStatus.saveInProgress).toBe(true)
  state = complete(state, grant(2), 'second')
  expect(state.saveStatus.saveInProgress).toBe(false)
})

test('another successful save does not hide a failed grant until it is saved', () => {
  let state = schedule(initialState(), 1, 'first')
  state = reducer(state, {
    type: 'haku/saveHaku/rejected',
    payload: 'unexpected-save-error',
    meta: { arg: { haku: grant(1), revision: 'first' } },
  })
  state = schedule(state, 2, 'second')
  state = complete(state, grant(2), 'second')
  expect(state.saveStatus.serverError).toBe('unexpected-save-error')
  state = reducer(state, { type: 'haku/completeManualSave', payload: true })
  expect(state.saveStatus.serverError).toBe('unexpected-save-error')
  state = schedule(state, 1, 'retry')
  state = complete(state, grant(1), 'retry')
  expect(state.saveStatus.serverError).toBeUndefined()
})
