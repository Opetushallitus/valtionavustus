import { configureStore } from '@reduxjs/toolkit'
import hakuReducer from './hakuReducer'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { apiSlice } from '../apiSlice'

const store = configureStore({
  reducer: {
    haku: hakuReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
})

export default store

export type HakujenHallintaRootState = ReturnType<typeof store.getState>
export type HakujenHallintaAppDispatch = typeof store.dispatch

export const useHakujenHallintaDispatch: () => HakujenHallintaAppDispatch = useDispatch
export const useHakujenHallintaSelector: TypedUseSelectorHook<HakujenHallintaRootState> =
  useSelector
