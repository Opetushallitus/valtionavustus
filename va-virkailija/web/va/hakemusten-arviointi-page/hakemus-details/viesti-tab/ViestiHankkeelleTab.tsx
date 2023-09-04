import React, { useEffect, useState } from 'react'

import { fetchSentEmails, sendEmail } from '../sentEmails'
import ViestiLista, { Message } from '../ViestiLista'
import MultipleRecipentEmailForm, {
  Email,
  generateInitialEmail,
} from '../common-components/MultipleRecipentsEmailForm'
import { useHakemusLoadingAware } from '../../useHakemus'
import { useHakemustenArviointiSelector } from '../../arviointiStore'
import { getLoadedState } from '../../arviointiReducer'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

export function ViestiHankkeelleTab() {
  const hakemus = useHakemusLoadingAware()
  const { hakuData } = useHakemustenArviointiSelector((state) => getLoadedState(state.arviointi))
  const { avustushaku } = hakuData

  if (!hakemus) {
    return null
  }
  return <LoadedViestiHankkeelleTab hakemus={hakemus} avustushaku={avustushaku} />
}

type Props = {
  avustushaku: Avustushaku
  hakemus: Hakemus
}

function LoadedViestiHankkeelleTab({ avustushaku, hakemus }: Props) {
  const [sentEmails, setSentEmails] = useState<Message[]>([])

  useEffect(
    function () {
      async function fetchEmails() {
        const sentEmails = await fetchSentEmails(avustushaku, hakemus, 'vapaa-viesti')
        setSentEmails(sentEmails)
      }
      fetchEmails()
    },
    [avustushaku, hakemus]
  )

  const [email, setEmail] = useState<Email>(generateInitialEmail(hakemus))
  const [formErrorMessage, setFormErrorMessage] = useState<string | undefined>(undefined)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()

    async function send() {
      try {
        setFormErrorMessage(undefined)
        await sendEmail(
          'vapaa-viesti',
          avustushaku,
          hakemus,
          email.content,
          email.subject,
          email.receivers
        )
        setEmail(generateInitialEmail(hakemus))
      } catch (err: any) {
        if (err?.name === 'HttpResponseError' && err?.response?.status === 400) {
          setFormErrorMessage(err.response.data.error)
        } else {
          setFormErrorMessage('Viestin lähetys epäonnistui')
        }
      }
    }
    async function fetchEmails() {
      const sentEmails = await fetchSentEmails(avustushaku, hakemus, 'vapaa-viesti')
      setSentEmails(sentEmails)
    }
    send().then(fetchEmails)
  }

  return (
    <div>
      {sentEmails.length > 0 && (
        <>
          <h2>Aiemmin lähetetyt viestit</h2>
          <ViestiLista messages={sentEmails} />
        </>
      )}
      <h2>Lähetä viesti hankkeelle</h2>
      <MultipleRecipentEmailForm
        onSubmit={handleSubmit}
        email={email}
        setEmail={setEmail}
        formName="viestihankkeelle"
        submitText="Lähetä viesti"
        cancelButton={{
          text: 'Peruuta',
          onClick: () => {},
        }}
        errorText={formErrorMessage}
      />
    </div>
  )
}
