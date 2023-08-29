import { autoBatchEnhancer, configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { apiSlice } from '../apiSlice'

type State = { talousarviotiliIdInEditing?: number }
const initialState: State = { talousarviotiliIdInEditing: undefined }

const talousarviotilienHallintaSlice = createSlice({
  name: 'talousarviotilienHallinta',
  initialState,
  reducers: {
    editTalousarviotili: (state, payload: PayloadAction<number>) => {
      state.talousarviotiliIdInEditing = payload.payload
    },
    stopEditing: (state) => {
      state.talousarviotiliIdInEditing = undefined
    },
  },
})

export const { editTalousarviotili, stopEditing } = talousarviotilienHallintaSlice.actions

export const store = configureStore({
  reducer: {
    talousarviotilienHallinta: talousarviotilienHallintaSlice.reducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(apiSlice.middleware),
  enhancers: (existingEnhancers) => existingEnhancers.concat(autoBatchEnhancer()),
})

export type RootState = ReturnType<typeof store.getState>

export type AppDispatch = typeof store.dispatch

export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector
