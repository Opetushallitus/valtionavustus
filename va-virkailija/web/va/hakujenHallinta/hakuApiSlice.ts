import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import { Talousarviotili } from "../koodienhallinta/types";

export const hakuApiSlice = createApi({
  reducerPath: "hakuApiSlice",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  endpoints: (builder) => ({
    getTalousarvioTilit: builder.query<Talousarviotili[], void>({
      query: () => `api/talousarviotilit`,
    }),
  }),
});

export const { useGetTalousarvioTilitQuery } = hakuApiSlice;
