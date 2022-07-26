import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import { VaCodeValue } from "../types";
import { ValueType } from "./types";

const vaCodesTag = "VaCodes";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/api" }),
  tagTypes: [vaCodesTag],
  endpoints: (builder) => ({
    getVaCodeValues: builder.query<
      VaCodeValue[],
      { valueType: ValueType; year: string }
    >({
      query: ({ valueType, year }) => {
        const params = new URLSearchParams();
        params.set("value-type", valueType);
        if (year !== "") {
          params.set("year", year);
        }
        return `/v2/va-code-values?${params.toString()}`;
      },
      providesTags: [vaCodesTag],
    }),
    addVaCode: builder.mutation<VaCodeValue, Omit<VaCodeValue, "id">>({
      query: (initialCode) => ({
        url: "/v2/va-code-values",
        method: "POST",
        body: initialCode,
      }),
      invalidatesTags: [vaCodesTag],
    }),
    updateVaCodeVisibility: builder.mutation<
      void,
      { id: number; hidden: boolean }
    >({
      query: ({ id, hidden }) => ({
        url: `/v2/va-code-values/${id}/`,
        method: "POST",
        body: { hidden },
      }),
      invalidatesTags: [vaCodesTag],
    }),
    removeVaCode: builder.mutation<void, number>({
      query: (id) => ({
        url: `/v2/va-code-values/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [vaCodesTag],
    }),
  }),
});

export const {
  useGetVaCodeValuesQuery,
  useAddVaCodeMutation,
  useUpdateVaCodeVisibilityMutation,
  useRemoveVaCodeMutation,
} = apiSlice;
