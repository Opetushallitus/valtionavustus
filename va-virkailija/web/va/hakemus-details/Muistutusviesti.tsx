import React, { useState } from 'react'
import cn from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import './muistutusviesti.less'
import ViestiLista from './ViestiLista'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  lang: Language
}

const messages = [
  {
    id: 1,
    date: new Date('2023-07-14'),
    virkailija: 'Ville Virkailija',
    sender: 'ville.virkailija@example.com',
    subject: 'Viestin aihe 1',
    message: 'Viesti 1',
    receivers: ['vastaanottaja@example.com', 'vastaanottaja2@example.com'],
  },
  {
    id: 2,
    date: new Date('2023-07-12'),
    virkailija: 'Ville Virkailija',
    sender: 'ville.virkailija@example.com',
    subject: 'Viestin aihe 2',
    message: 'Viesti 2',
    receivers: ['vastaanottaja@example.com', 'vastaanottaja2@example.com'],
  },
  {
    id: 3,
    date: new Date('2023-07-10'),
    virkailija: 'Ville Virkailija',
    sender: 'ville.virkailija@example.com',
    subject: 'Viestin aihe 3',
    message:
      'Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3Viesti 3',
    receivers: ['vastaanottaja@example.com', 'vastaanottaja2@example.com'],
  },
]
export default function MuistutusViesti({ avustushaku, hakemus, lang }: MuistutusviestiProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)

  const contactEmail = hakemus.normalizedData?.['contact-email']
  const trustedContactEmail = hakemus.normalizedData?.['trusted-contact-email']
  const receivers = [contactEmail, trustedContactEmail].filter(
    (email): email is string => typeof email === 'string'
  )
  const initialEmail = {
    lang,
    subject: '',
    content: '',
    receivers: receivers,
  }
  const [email, setEmail] = useState(initialEmail)

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

  const containsSentMessage = messages.length > 1

  return (
    <>
      <div
        className={cn('writeMuistutusviesti', {
          ['noBottomBorder']: showEmailForm || containsSentMessage,
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
      <ViestiLista messages={messages} />
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
