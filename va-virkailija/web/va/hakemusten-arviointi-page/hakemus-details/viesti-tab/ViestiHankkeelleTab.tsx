import React, { useEffect, useId, useState } from 'react'

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
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { useEnvironment, useUserInfo } from '../../../initial-data-context'
import type { UserInfo } from '../../../types'
import PaatosUrl from '../../../PaatosUrl'

function generateEmailWithHeaderAndFooter(
  environment: EnvironmentApiResponse,
  avustushakuId: number,
  hakemus: Hakemus,
  userInfo: UserInfo
): Email {
  const email = generateInitialEmail(hakemus)
  if (hakemus.language !== 'fi') {
    // No translation yet
    return email
  }

  const registerNumber = hakemus['register-number']
  const registerNumberStr = registerNumber ? ` (${registerNumber})` : ''
  const header = `Hyvä vastaanottaja,

tämä viesti koskee avustusta ${hakemus['project-name']}${registerNumberStr}.\n\n`

  const paatosUrl = PaatosUrl.hakijaPublicLink(environment, avustushakuId, hakemus)
  const footer = `\n\nLinkki avustuspäätökseen: ${paatosUrl}

Tarvittaessa tarkempia lisätietoja voi kysyä viestin lähettäjältä.

Ystävällisin terveisin,
${userInfo['first-name']} ${userInfo.surname}
${userInfo.email}`

  return {
    ...email,
    subject: 'Viesti Opetushallituksen avustukseen liittyen',
    header,
    footer,
  }
}

type Props = {
  avustushaku: Avustushaku
  hakemus: Hakemus
}

function LoadedViestiHankkeelleTab({ avustushaku, hakemus }: Props) {
  const userInfo = useUserInfo()
  const environment = useEnvironment()
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

  const [email, setEmail] = useState<Email>(
    generateEmailWithHeaderAndFooter(environment, avustushaku.id, hakemus, userInfo)
  )

  const [formErrorMessage, setFormErrorMessage] = useState<string | undefined>(undefined)

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault()
    e.stopPropagation()

    async function send() {
      const content = [email.header, email.content, email.footer].join('\n\n')
      try {
        setFormErrorMessage(undefined)
        await sendEmail(
          'vapaa-viesti',
          avustushaku,
          hakemus,
          content,
          email.subject,
          email.receivers
        )
        setEmail(generateEmailWithHeaderAndFooter(environment, avustushaku.id, hakemus, userInfo))
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

  const listSectionHeading = useId()
  const emailFormHeading = useId()

  return (
    <>
      {sentEmails.length > 0 && (
        <section role="list" aria-labelledby={listSectionHeading}>
          <h2 id={listSectionHeading}>Aiemmin lähetetyt viestit</h2>
          <ViestiLista messages={sentEmails} />
        </section>
      )}
      <section aria-labelledby={emailFormHeading}>
        <h2 id={emailFormHeading}>Lähetä viesti hankkeelle</h2>
        <MultipleRecipentEmailForm
          onSubmit={handleSubmit}
          email={email}
          setEmail={setEmail}
          formName="viestihankkeelle"
          submitText="Lähetä viesti"
          errorText={formErrorMessage}
          preview
        />
      </section>
    </>
  )
}

export function ViestiHankkeelleTab() {
  const hakemus = useHakemusLoadingAware()
  const { hakuData } = useHakemustenArviointiSelector((state) => getLoadedState(state.arviointi))
  const { avustushaku } = hakuData

  if (!hakemus) {
    return null
  }
  return <LoadedViestiHankkeelleTab hakemus={hakemus} avustushaku={avustushaku} />
}
