import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/dist/query/react'
import { Lahetys } from '../haku-details/Tapahtumaloki'
import { Message } from '../hakemus-details/ViestiLista'

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

export type EmailType = 'taydennyspyynto-asiatarkastus' | 'taydennyspyynto-taloustarkastus'

const tapahtumalokiEmailsTag = 'tapahtumalokiEmails'

export const arviointiApiSlice = createApi({
  reducerPath: 'arviointiApiSlice',
  tagTypes: [tapahtumalokiEmailsTag],
  baseQuery: fetchBaseQuery({ baseUrl: '/' }),
  endpoints: (builder) => ({
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

export const { useGetTapahtumalokiForEmailTypeQuery, usePostLoppuselvitysTaydennyspyyntoMutation } =
  arviointiApiSlice
