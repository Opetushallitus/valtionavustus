import { configureStore } from "@reduxjs/toolkit";
import formReducer from "soresu-form/form/formReducer";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";

const store = configureStore({
  reducer: {
    form: formReducer,
  },
});

export default store;

export type HakijaRootState = ReturnType<typeof store.getState>;
export type HakijaAppDispatch = typeof store.dispatch;

export const useHakijaDispatch: () => HakijaAppDispatch = useDispatch;
export const useHakijaSelector: TypedUseSelectorHook<HakijaRootState> =
  useSelector;
