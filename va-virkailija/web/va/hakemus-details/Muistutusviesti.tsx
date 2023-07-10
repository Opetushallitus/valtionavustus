import React, { useState } from 'react'

import { Language } from 'soresu-form/web/va/i18n/translations'
import { Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'

type MuistutusviestiProps = {
  hakemus: Hakemus
  lang: Language
}

export default function MuistutusViesti({ hakemus, lang }: MuistutusviestiProps) {
  const contactEmail = hakemus.normalizedData?.['contact-email']
  const [email, setEmail] = useState({
    lang,
    subject: '',
    content: '',
    receivers: contactEmail ? [contactEmail] : [],
  })

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }

  return (
    <MultipleRecipentEmailForm
      onSubmit={onSubmit}
      disabled={false}
      email={email}
      setEmail={setEmail}
      formName="muistutusviesti"
      submitText="Lähetä muistutusviesti"
      heading="Lähetä muistutusviesti"
    />
  )
}
