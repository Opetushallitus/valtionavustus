import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import arviointiReducer, {
  ArviointiState,
  saveHakemusArvio,
  startHakemusArvioAutoSave,
} from './arviointiReducer'
import filterReducer from './filterReducer'
import { apiSlice } from '../apiSlice'

const arvioAutoSave = createListenerMiddleware<{ arviointi: ArviointiState }>()
const pendingSaveTimers = new Map<number, ReturnType<typeof setTimeout>>()
arvioAutoSave.startListening({
  actionCreator: startHakemusArvioAutoSave,
  effect: (action, listenerApi) => {
    const { hakemusId } = action.payload
    const existingTimer = pendingSaveTimers.get(hakemusId)
    if (existingTimer !== undefined) {
      clearTimeout(existingTimer)
    }
    pendingSaveTimers.set(
      hakemusId,
      setTimeout(() => {
        pendingSaveTimers.delete(hakemusId)
        listenerApi.dispatch(saveHakemusArvio({ hakemusId }))
      }, 3000)
    )
  },
})

const store = configureStore({
  reducer: {
    arviointi: arviointiReducer,
    filter: filterReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware).prepend(arvioAutoSave.middleware),
})

export default store

export type HakemustenArviointiRootState = ReturnType<typeof store.getState>

export type HakemustenArviointiAppDispatch = typeof store.dispatch

export const useHakemustenArviointiDispatch: () => HakemustenArviointiAppDispatch = useDispatch
export const useHakemustenArviointiSelector: TypedUseSelectorHook<HakemustenArviointiRootState> =
  useSelector
