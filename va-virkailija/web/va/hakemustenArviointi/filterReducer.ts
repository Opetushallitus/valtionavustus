import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AnswerFilter, HakemusFilter } from "../types";

const initialState: HakemusFilter = {
  answers: [],
  isOpen: false,
  openQuestions: [],
};

const filterSlice = createSlice({
  name: "arviointiFilter",
  initialState,
  reducers: {
    toggleFilter: (state) => {
      state.isOpen = !state.isOpen;
    },
    clearFilters: (state) => {
      state.answers = [];
    },
    setAnswerFilter: (state, { payload }: PayloadAction<AnswerFilter[]>) => {
      state.answers = payload;
    },
    setOpenQuestions: (state, { payload }: PayloadAction<string[]>) => {
      state.openQuestions = payload;
    },
  },
});

export const { toggleFilter, clearFilters, setAnswerFilter, setOpenQuestions } =
  filterSlice.actions;

export default filterSlice.reducer;
