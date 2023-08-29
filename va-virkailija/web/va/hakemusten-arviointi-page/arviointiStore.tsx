import { autoBatchEnhancer, configureStore, createListenerMiddleware } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import arviointiReducer, {
  ArviointiState,
  saveHakemusArvio,
  startHakemusArvioAutoSave,
} from './arviointiReducer'
import filterReducer from './filterReducer'
import { apiSlice } from '../apiSlice'

const arvioAutoSave = createListenerMiddleware<{ arviointi: ArviointiState }>()
arvioAutoSave.startListening({
  actionCreator: startHakemusArvioAutoSave,
  effect: async (action, listenerApi) => {
    listenerApi.cancelActiveListeners()
    await listenerApi.delay(3000)
    await listenerApi.dispatch(saveHakemusArvio(action.payload))
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
  enhancers: (existingEnhancers) => existingEnhancers.concat(autoBatchEnhancer()),
})

export default store

export type HakemustenArviointiRootState = ReturnType<typeof store.getState>

export type HakemustenArviointiAppDispatch = typeof store.dispatch

export const useHakemustenArviointiDispatch: () => HakemustenArviointiAppDispatch = useDispatch
export const useHakemustenArviointiSelector: TypedUseSelectorHook<HakemustenArviointiRootState> =
  useSelector
