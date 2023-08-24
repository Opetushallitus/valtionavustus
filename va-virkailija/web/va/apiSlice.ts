import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { Raportointivelvoite } from 'soresu-form/web/va/types'
import { Message } from './hakemusten-arviointi-page/hakemus-details/ViestiLista'
import { Lahetys } from './hakujen-hallinta-page/haku-details/Tapahtumaloki'
import { UserInfo, VaCodeValue } from './types'
import {
  CreateTalousarviotili,
  TalousarviotiliWithUsageInfo,
  UpdateTalousarviotili,
  ValueType,
} from './koodienhallinta-page/types'

export type EmailType = 'taydennyspyynto-asiatarkastus' | 'taydennyspyynto-taloustarkastus'

const vaCodesTag = 'VaCodes'
const talousarviotilitTag = 'talousarviotilit'
const raportointiveloitteetTag = 'raportointiveloitteet'
const tapahtumalokiEmailsTag = 'tapahtumalokiEmails'

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  tagTypes: [vaCodesTag, talousarviotilitTag, raportointiveloitteetTag, tapahtumalokiEmailsTag],
  endpoints: (builder) => ({
    getVaCodeValues: builder.query<VaCodeValue[], { valueType: ValueType; year: string }>({
      query: ({ valueType, year }) => {
        const params = new URLSearchParams()
        params.set('value-type', valueType)
        if (year !== '') {
          params.set('year', year)
        }
        return `api/v2/va-code-values?${params.toString()}`
      },
      providesTags: [vaCodesTag],
    }),
    addVaCode: builder.mutation<VaCodeValue, Omit<VaCodeValue, 'id'>>({
      query: (initialCode) => ({
        url: 'api/v2/va-code-values',
        method: 'POST',
        body: initialCode,
      }),
      invalidatesTags: [vaCodesTag],
    }),
    updateVaCodeVisibility: builder.mutation<void, { id: number; hidden: boolean }>({
      query: ({ id, hidden }) => ({
        url: `api/v2/va-code-values/${id}/`,
        method: 'POST',
        body: { hidden },
      }),
      invalidatesTags: [vaCodesTag],
    }),
    removeVaCode: builder.mutation<void, number>({
      query: (id) => ({
        url: `api/v2/va-code-values/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [vaCodesTag],
    }),
    getEnvironmentAndUserInfo: builder.query<
      {
        userInfo: UserInfo
        environment: EnvironmentApiResponse
      },
      void
    >({
      queryFn: async (_arg, _queryApi, _extraOpts, baseQuery) => {
        const [environment, userInfo] = await Promise.all([
          baseQuery('/environment'),
          baseQuery('api/userinfo'),
        ])
        return {
          data: {
            environment: environment.data as EnvironmentApiResponse,
            userInfo: userInfo.data as UserInfo,
          },
        }
      },
    }),
    getTalousarvioTilit: builder.query<TalousarviotiliWithUsageInfo[], void>({
      query: () => 'api/talousarviotilit',
      providesTags: [talousarviotilitTag],
    }),
    createTalousarviotili: builder.mutation<TalousarviotiliWithUsageInfo, CreateTalousarviotili>({
      query: (newTalousarviotili) => ({
        url: `api/talousarviotilit/`,
        method: 'POST',
        body: newTalousarviotili,
      }),
      invalidatesTags: [talousarviotilitTag],
    }),
    removeTalousarviotili: builder.mutation<void, number>({
      query: (id) => ({
        url: `api/talousarviotilit/${id}/`,
        method: 'DELETE',
      }),
      invalidatesTags: [talousarviotilitTag],
    }),
    updateTalousarviotili: builder.mutation<void, UpdateTalousarviotili>({
      query: (talousarviotili) => ({
        url: `api/talousarviotilit/${talousarviotili.id}/`,
        method: 'POST',
        body: talousarviotili,
      }),
      invalidatesTags: [talousarviotilitTag],
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
    getTapahtumalokiForEmailType: builder.query<
      Message[],
      { avustushakuId: number; hakemusId: number; emailType: EmailType }
    >({
      query: ({ avustushakuId, hakemusId, emailType }) =>
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/tapahtumaloki/${emailType}`,
      transformResponse(response: Lahetys[]) {
        return response.flatMap(mapEmails)
      },
      providesTags: (_result, _error, arg) => {
        return [{ type: tapahtumalokiEmailsTag, id: arg.emailType }]
      },
    }),
    postLoppuselvitysTaydennyspyynto: builder.mutation<
      void,
      {
        avustushakuId: number
        hakemusId: number
        email: {
          lang: 'fi' | 'sv'
          type: EmailType
          body: string
          subject: string
          to: string[]
        }
      }
    >({
      query: ({ avustushakuId, hakemusId, email }) => ({
        url: `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/loppuselvitys/taydennyspyynto`,
        method: 'POST',
        body: email,
      }),
      invalidatesTags: (_result, _error, arg) => [
        { type: tapahtumalokiEmailsTag, id: arg.email.type },
      ],
    }),
  }),
})

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
  useGetTapahtumalokiForEmailTypeQuery,
  usePostLoppuselvitysTaydennyspyyntoMutation,
  useGetRaportointiveloitteetQuery,
  usePutRaportointivelvoiteMutation,
  usePostRaportointivelvoiteMutation,
  useDeleteRaportointivelvoiteMutation,
} = apiSlice

export const mapEmails = ({ user_name, email_content }: Lahetys): Message | Message[] => {
  if (!email_content) {
    return []
  }
  return {
    date: email_content.created_at,
    id: email_content.id,
    message: email_content.formatted,
    receivers: email_content.to_address,
    sender: email_content.from_address,
    subject: email_content.subject,
    virkailija: user_name,
  }
}
