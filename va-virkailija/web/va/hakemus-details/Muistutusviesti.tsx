import React, { useState } from 'react'
import cn from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import './muistutusviesti.less'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  lang: Language
}

export default function MuistutusViesti({ avustushaku, hakemus, lang }: MuistutusviestiProps) {
  const [showEmailForm, setShowEmailForm] = useState(false)

  const contactEmail = hakemus.normalizedData?.['contact-email']
  const initialEmail = {
    lang,
    subject: '',
    content: '',
    receivers: contactEmail ? [contactEmail] : [],
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

  return (
    <>
      <div
        className={cn('writeMuistutusviesti', {
          ['formOpen']: showEmailForm,
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
