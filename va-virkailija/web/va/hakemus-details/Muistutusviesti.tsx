import React, { useState } from 'react'

import { Language } from 'soresu-form/web/va/i18n/translations'
import { Hakemus } from 'soresu-form/web/va/types'
import './muistutusviesti.less'
import cn from 'classnames'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'

type MuistutusviestiProps = {
  hakemus: Hakemus
  lang: Language
}

export default function MuistutusViesti({ hakemus, lang }: MuistutusviestiProps) {
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
          disabled={false}
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
