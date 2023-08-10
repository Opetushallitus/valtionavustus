import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { TalousarviotiliWithUsageInfo } from '../koodienhallinta/types'
import { Raportointivelvoite } from 'soresu-form/web/va/types'

const raportointiveloitteetTag = 'raportointiveloitteet'

export const hakuApiSlice = createApi({
  reducerPath: 'hakuApiSlice',
  tagTypes: [raportointiveloitteetTag],
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
    getTalousarvioTilit: builder.query<TalousarviotiliWithUsageInfo[], void>({
      query: () => `api/talousarviotilit`,
    }),
    getRaportointiveloitteet: builder.query<Raportointivelvoite[], number>({
      query: (avustushakuId) => `/api/avustushaku/${avustushakuId}/raportointivelvoitteet`,
      providesTags: [raportointiveloitteetTag],
    }),
    putRaportointivelvoite: builder.mutation<
      Raportointivelvoite,
      { raportointivelvoite: Raportointivelvoite; avustushakuId: number }
    >({
      query: ({ raportointivelvoite, avustushakuId }) => ({
        url: `/api/avustushaku/${avustushakuId}/raportointivelvoite`,
        method: 'PUT',
        body: raportointivelvoite,
      }),
      invalidatesTags: [raportointiveloitteetTag],
    }),
    postRaportointivelvoite: builder.mutation<
      Raportointivelvoite,
      { raportointivelvoite: Raportointivelvoite; avustushakuId: number }
    >({
      query: ({ raportointivelvoite, avustushakuId }) => ({
        url: `/api/avustushaku/${avustushakuId}/raportointivelvoite/${raportointivelvoite.id}`,
        method: 'POST',
        body: raportointivelvoite,
      }),
      invalidatesTags: [raportointiveloitteetTag],
    }),
    deleteRaportointivelvoite: builder.mutation<
      Raportointivelvoite,
      { raportointivelvoiteId: number; avustushakuId: number }
    >({
      query: ({ raportointivelvoiteId, avustushakuId }) => ({
        url: `/api/avustushaku/${avustushakuId}/raportointivelvoite/${raportointivelvoiteId}`,
        method: 'DELETE',
      }),
      invalidatesTags: [raportointiveloitteetTag],
    }),
  }),
})

export const {
  useGetTalousarvioTilitQuery,
  useGetRaportointiveloitteetQuery,
  usePutRaportointivelvoiteMutation,
  usePostRaportointivelvoiteMutation,
  useDeleteRaportointivelvoiteMutation,
} = hakuApiSlice
