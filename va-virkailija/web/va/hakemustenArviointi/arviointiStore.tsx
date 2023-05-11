import { configureStore } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'

import arviointiReducer from './arviointiReducer'
import filterReducer from './filterReducer'
import { hakemustenArviointiListenerMiddleware } from './hakemustenArviointiListening'

const store = configureStore({
  reducer: {
    arviointi: arviointiReducer,
    filter: filterReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(hakemustenArviointiListenerMiddleware.middleware),
})

export default store

export type HakemustenArviointiRootState = ReturnType<typeof store.getState>

export type HakemustenArviointiAppDispatch = typeof store.dispatch

export const useHakemustenArviointiDispatch: () => HakemustenArviointiAppDispatch = useDispatch
export const useHakemustenArviointiSelector: TypedUseSelectorHook<HakemustenArviointiRootState> =
  useSelector
