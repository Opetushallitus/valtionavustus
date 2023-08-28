import React, { useEffect, useState } from 'react'
import './ViestiHankkeelle.less'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'
import { fetchSentEmails } from './sentEmails'
import ViestiLista, { Message } from './ViestiLista'
import { useHakemus } from '../useHakemus'
import { useHakemustenArviointiSelector } from '../arviointiStore'
import { getLoadedState } from '../arviointiReducer'
async function fetchViestiHankkeelleEmails(
  avustushaku: Avustushaku,
  hakemus: Hakemus
): Promise<Array<Message>> {
  return fetchSentEmails(avustushaku, hakemus, 'vapaa-viesti')
}

export function ViestiHankkeelle() {
  const hakemus = useHakemus()
  const { hakuData } = useHakemustenArviointiSelector((state) => getLoadedState(state.arviointi))

  const { avustushaku } = hakuData
  const [sentEmails, setSentEmails] = useState<Message[]>([])
  useEffect(function () {
    async function fetchEmails() {
      const sentEmails = await fetchViestiHankkeelleEmails(avustushaku, hakemus)
      setSentEmails(sentEmails)
    }
    fetchEmails()
  }, [])
  return (
    <div>
      <h1 className={'title'}>Viesti Hankkeelle</h1>
      <ViestiLista messages={sentEmails} />
    </div>
  )
}
