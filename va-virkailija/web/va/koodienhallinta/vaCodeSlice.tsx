import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { ValueType } from "./types";
import { RootState } from "./store";

interface VaCodeState {
  selectedTab: ValueType;
  filter: {
    year: string;
    word: string;
  };
}

const initialState: VaCodeState = {
  selectedTab: "operational-unit",
  filter: {
    year: "",
    word: "",
  },
};

export const vaCodeSlice = createSlice({
  name: "vaCodeValue",
  initialState,
  reducers: {
    updateFilter: (
      state,
      action: PayloadAction<{
        filter: keyof VaCodeState["filter"];
        value: string;
      }>
    ) => {
      state.filter[action.payload.filter] = action.payload.value;
    },
    selectTab: (state, action: PayloadAction<ValueType>) => {
      state.selectedTab = action.payload;
      state.filter.year = "";
      state.filter.word = "";
    },
  },
});

export const { updateFilter, selectTab } = vaCodeSlice.actions;

export default vaCodeSlice.reducer;

export const selectedTabSelector = (state: RootState) =>
  state.vaCode.selectedTab;
