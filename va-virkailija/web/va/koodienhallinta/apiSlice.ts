import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/dist/query/react";
import { UserInfo, VaCodeValue } from "../types";
import {
  CreateTalousarviotili,
  TalousarviotiliWithUsageInfo,
  UpdateTalousarviotili,
  ValueType,
} from "./types";
import { EnvironmentApiResponse } from "soresu-form/web/va/types/environment";

const vaCodesTag = "VaCodes";
const talousarviotilitTag = "talousarviotilit";

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({ baseUrl: "/" }),
  tagTypes: [vaCodesTag, talousarviotilitTag],
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
        return `api/v2/va-code-values?${params.toString()}`;
      },
      providesTags: [vaCodesTag],
    }),
    addVaCode: builder.mutation<VaCodeValue, Omit<VaCodeValue, "id">>({
      query: (initialCode) => ({
        url: "api/v2/va-code-values",
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
        url: `api/v2/va-code-values/${id}/`,
        method: "POST",
        body: { hidden },
      }),
      invalidatesTags: [vaCodesTag],
    }),
    removeVaCode: builder.mutation<void, number>({
      query: (id) => ({
        url: `api/v2/va-code-values/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [vaCodesTag],
    }),
    getEnvironmentAndUserInfo: builder.query<
      {
        userInfo: UserInfo;
        environment: EnvironmentApiResponse;
      },
      void
    >({
      queryFn: async (_arg, _queryApi, _extraOpts, baseQuery) => {
        const [environment, userInfo] = await Promise.all([
          baseQuery("/environment"),
          baseQuery("api/userinfo"),
        ]);
        return {
          data: {
            environment: environment.data as EnvironmentApiResponse,
            userInfo: userInfo.data as UserInfo,
          },
        };
      },
    }),
    getTalousarvioTilit: builder.query<TalousarviotiliWithUsageInfo[], void>({
      query: () => "api/talousarviotilit",
      providesTags: [talousarviotilitTag],
    }),
    createTalousarviotili: builder.mutation<
      TalousarviotiliWithUsageInfo,
      CreateTalousarviotili
    >({
      query: (newTalousarviotili) => ({
        url: `api/talousarviotilit/`,
        method: "POST",
        body: newTalousarviotili,
      }),
      invalidatesTags: [talousarviotilitTag],
    }),
    removeTalousarviotili: builder.mutation<void, number>({
      query: (id) => ({
        url: `api/talousarviotilit/${id}/`,
        method: "DELETE",
      }),
      invalidatesTags: [talousarviotilitTag],
    }),
    updateTalousarviotili: builder.mutation<void, UpdateTalousarviotili>({
      query: (talousarviotili) => ({
        url: `api/talousarviotilit/${talousarviotili.id}/`,
        method: "POST",
        body: talousarviotili,
      }),
      invalidatesTags: [talousarviotilitTag],
    }),
  }),
});

export const {
  useGetVaCodeValuesQuery,
  useGetEnvironmentAndUserInfoQuery,
  useAddVaCodeMutation,
  useUpdateVaCodeVisibilityMutation,
  useRemoveVaCodeMutation,
  useGetTalousarvioTilitQuery,
  useCreateTalousarviotiliMutation,
  useRemoveTalousarviotiliMutation,
  useUpdateTalousarviotiliMutation,
} = apiSlice;
