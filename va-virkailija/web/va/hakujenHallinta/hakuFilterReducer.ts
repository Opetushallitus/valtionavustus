import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import HakuStatuses from "../haku-details/HakuStatuses";
import HakuPhases from "../haku-details/HakuPhases";
import { FilterId } from "../types";

const initialState = {
  status: HakuStatuses.allStatuses(),
  phase: HakuPhases.allStatuses(),
  avustushaku: "",
  startdatestart: "",
  startdateend: "",
  enddatestart: "",
  enddateend: "",
};

const hakuFilterSlice = createSlice({
  name: "hakuFilter",
  initialState,
  reducers: {
    setFilter: (
      state,
      { payload }: PayloadAction<{ filterId: FilterId; filter: any }>
    ) => {
      state[payload.filterId] = payload.filter;
    },
    clearFilters: () => {
      return initialState;
    },
  },
});

export const { setFilter, clearFilters } = hakuFilterSlice.actions;

export default hakuFilterSlice.reducer;
