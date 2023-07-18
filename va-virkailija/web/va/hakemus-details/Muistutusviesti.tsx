import React, { useEffect, useState } from 'react'
import cn from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import './muistutusviesti.less'
import ViestiLista, { Message } from './ViestiLista'
import { Lahetys } from '../haku-details/Tapahtumaloki'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  lang: Language
}

export default function MuistutusViesti({ avustushaku, hakemus, lang }: MuistutusviestiProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [sentEmails, setSentEmails] = useState<Message[]>([])
  const containsSentEmails = sentEmails.length > 0
  const contactEmail = hakemus.normalizedData?.['contact-email']
  const trustedContactEmail = hakemus.normalizedData?.['trusted-contact-email']
  const initialEmail = generateInitialEmail(contactEmail, trustedContactEmail, lang)
  const [email, setEmail] = useState(initialEmail)

  useEffect(() => {
    async function fetchEmails() {
      const sentEmails = await fetchSentEmails(avustushaku, hakemus)
      setSentEmails(sentEmails)
    }

    fetchEmails()
  }, [])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    await HttpUtil.post(
      `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/loppuselvitys/send-reminder`,
      {
        lang,
        body: email.content,
        subject: email.subject,
        to: email.receivers,
      }
    )
  }

  function cancelForm() {
    setEmail(initialEmail)
    setShowEmailForm(false)
  }
  console.log(containsSentEmails)
  return (
    <>
      <div
        className={cn('writeMuistutusviesti', {
          ['noBottomBorder']: showEmailForm || containsSentEmails,
        })}
      >
        <h2>Muistutusviesti</h2>
        <button
          onClick={() => setShowEmailForm(!showEmailForm)}
          className="writeMuistutusviestiButton"
        >
          Kirjoita
        </button>
      </div>
      <ViestiLista messages={sentEmails} />
      {showEmailForm && (
        <MultipleRecipentEmailForm
          onSubmit={onSubmit}
          email={email}
          setEmail={setEmail}
          formName="muistutusviesti"
          submitText="Lähetä muistutusviesti"
          heading="Lähetä muistutusviesti"
          cancelButton={{
            text: 'Peruuta',
            onClick: cancelForm,
          }}
        />
      )}
    </>
  )
}
function generateInitialEmail(
  contactEmail: string | undefined,
  trustedContactEmail: string | undefined,
  lang: Language
) {
  const receivers = [contactEmail, trustedContactEmail].filter(
    (email): email is string => typeof email === 'string'
  )
  const initialEmail = {
    lang,
    subject: '',
    content: '',
    receivers: receivers,
  }
  return initialEmail
}

async function fetchSentEmails(avustushaku: Avustushaku, hakemus: Hakemus): Promise<Message[]> {
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/tapahtumaloki/loppuselvitys-muistutus`
  )
  const mappedEmails: Message[] = sentEmails.flatMap(({ user_name, email_content }) => {
    if (!email_content) return []
    return {
      date: new Date(email_content.created_at),
      id: email_content.id,
      message: email_content.formatted,
      receivers: email_content.to_address,
      sender: email_content.from_address,
      subject: email_content.subject,
      virkailija: user_name,
    }
  })
  return mappedEmails
}
