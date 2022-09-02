import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import { TalousarviotiliWithUsageInfo } from "../koodienhallinta/types";

export const hakuApiSlice = createApi({
  reducerPath: "hakuApiSlice",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    getTalousarvioTilit: builder.query<TalousarviotiliWithUsageInfo[], void>({
      query: () => `api/talousarviotilit`,
    }),
  }),
});

export const { useGetTalousarvioTilitQuery } = hakuApiSlice;
