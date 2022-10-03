import { configureStore } from "@reduxjs/toolkit";
import { TypedUseSelectorHook, useDispatch, useSelector } from "react-redux";
import arviointiReducer from "./arviointiReducer";
import filterReducer from "./filterReducer";

const store = configureStore({
  reducer: {
    arviointi: arviointiReducer,
    filter: filterReducer,
  },
});

export default store;

export type HakemustenArviointiRootState = ReturnType<typeof store.getState>;

export type HakemustenArviointiAppDispatch = typeof store.dispatch;

export const useHakemustenArviointiDispatch: () => HakemustenArviointiAppDispatch =
  useDispatch;
export const useHakemustenArviointiSelector: TypedUseSelectorHook<HakemustenArviointiRootState> =
  useSelector;
