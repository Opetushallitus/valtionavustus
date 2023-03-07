import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Field, Form } from "./formTypes";
import HttpUtil from "soresu-form/web/HttpUtil";

type InitialState = {
  form: Form | undefined;
};

const initialState: InitialState = {
  form: undefined,
};

const formReducer = createSlice({
  name: "formReducer",
  initialState,
  reducers: {
    updateForm: (state, { payload }: PayloadAction<Field>) => {
      let found = state.form?.content.find(recursiveSearchForId(payload.id));
      if (found) {
        found = payload;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(initializeForm.fulfilled, (state, { payload }) => {
      state.form = payload;
    });
  },
});

export default formReducer.reducer;

const searchForId = (idToFind: string) => (field: Field) =>
  field.id === idToFind;

const recursiveSearchForId =
  (idToFind: string) =>
  (field: Field): boolean => {
    if (field.id === idToFind) {
      return true;
    }
    if (field.fieldClass === "wrapperElement") {
      return !!field.children?.find(searchForId(idToFind));
    }
    return false;
  };

export const initializeForm = createAsyncThunk<Form, number>(
  "formReducer/initializeForm",
  async (formId) => {
    return await HttpUtil.get<Form>(`/api/form/${formId}`);
  }
);
