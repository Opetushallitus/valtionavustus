import React from 'react'

import DateUtil from 'soresu-form/web/DateUtil'

export type Lahetys = {
  avustushaku_id: number
  batch_id: string
  created_at: string
  emails: {
    addresses: string[]
  }
  hakemus_id: number
  id: number
  success: boolean
  tyyppi: LahetysType
  user_name: string
  user_oid: string
  email_content?: EmailContent | null
}

type EmailContent = {
  id: number
  subject: string
  sender: string
  formatted: string
  created_at: string
  to_address: string[]
  from_address: string
}

type LahetysType = 'paatoksen_lahetys' | 'valiselvitys-notification' | 'loppuselvitys-notification'

type TapahtumalokiProps = {
  lahetykset: Lahetys[]
}

const typeTranslation = (type: LahetysType) => {
  return {
    paatoksen_lahetys: 'päätökset',
    'valiselvitys-notification': 'väliselvitykset',
    'loppuselvitys-notification': 'loppuselvitykset',
  }[type]
}

type LahetyksetByBatchId = {
  [batchId: string]: Lahetys[]
}

function groupLahetyksetByBatchId(array: Lahetys[]) {
  return array.reduce<LahetyksetByBatchId>((lahetyksetByBatchId, lahetys) => {
    const batchId = lahetys.batch_id
    return {
      ...lahetyksetByBatchId,
      [batchId]: (lahetyksetByBatchId[batchId] ?? []).concat(lahetys),
    }
  }, {})
}

export const Tapahtumaloki = ({ lahetykset }: TapahtumalokiProps) => {
  const dateTime = (d: string) => `${DateUtil.asDateString(d)} ${DateUtil.asTimeString(d)}`

  const latestFirst = (a: Lahetys[], b: Lahetys[]) => {
    if (a[0].created_at > b[0].created_at) return -1
    if (a[0].created_at < b[0].created_at) return 1
    return 0
  }

  const timestamp = (entries: Lahetys[]) => dateTime(entries[0].created_at) // Assume mails have same approx sent time
  const sender = (entries: Lahetys[]) => entries[0].user_name // Assume that all entries within same batch have the same sender
  const sentMails = (entries: Lahetys[]) => entries.filter((e) => e.success).length
  const failedMails = (entries: Lahetys[]) => entries.filter((e) => !e.success).length

  // List of lists, each of which contain all sent emails sent by one transaction (i.e. batch_id), e.g. "lähetä päätökset"
  const groupedLahetykset = Object.values(groupLahetyksetByBatchId(lahetykset)).sort(latestFirst)

  return (
    <div className={'tapahtumaloki'}>
      <div className={'header'}>{`Lähetetyt ${typeTranslation(lahetykset[0].tyyppi)}`}</div>
      <div className={'entries'}>
        <div className={'header-row'}>
          <span className={'timestamp header'}>Lähetysaika</span>
          <span className={'sender header'}>Lähettäjä</span>
          <span className={'sentCount header'}>Lähetettyjä viestejä</span>
          <span className={'failedCount header'}>Epäonnistuneita lähetyksiä</span>
        </div>
        {groupedLahetykset.map((l, i) => (
          <div key={i} className={'entry'}>
            <span className={'timestamp'}>{timestamp(l)}</span>
            <span className={'sender'} data-test-id={`sender-${i}`}>
              {sender(l)}
            </span>
            <span className={'sentCount'} data-test-id={`sent-${i}`}>
              {sentMails(l)}
            </span>
            <span className={'failedCount'}>{failedMails(l)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
