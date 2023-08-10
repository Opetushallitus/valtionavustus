import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import HttpUtil from 'soresu-form/web/HttpUtil'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import ViestiLista, { Message } from './ViestiLista'
import { isString } from 'lodash'

import './muistutusviesti.less'
import { Lahetys } from '../haku-details/Tapahtumaloki'
import { mapEmails } from '../hakemustenArviointi/apiSlice'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  lang: Language
}

export async function fetchSentEmails(
  avustushaku: Avustushaku,
  hakemus: Hakemus
): Promise<Message[]> {
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/tapahtumaloki/loppuselvitys-muistutus`
  )
  return sentEmails.flatMap(mapEmails)
}

export default function MuistutusViesti({ avustushaku, hakemus, lang }: MuistutusviestiProps) {
  const [sentEmails, setSentEmails] = useState<Message[]>([])
  const [formErrorMessage, setFormErrorMessage] = useState<string>()
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

  const [showEmailForm, setShowEmailForm] = useState(false)
  const emailFormRef = useRef<HTMLDivElement>(null)
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  function openOrRevealEmailForm() {
    setShowEmailForm(true)
    revealEmailForm() // try reveal here, only works when form is open, therefore the component is already mounted
  }
  useEffect(() => {
    if (showEmailForm) {
      revealEmailForm() // reveal after showEmailForm changes to true and component is mounted
    }
  }, [showEmailForm])

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      await HttpUtil.post(
        `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/loppuselvitys/send-reminder`,
        {
          lang,
          body: email.content,
          subject: email.subject,
          to: email.receivers,
        }
      )

      const sentEmails = await fetchSentEmails(avustushaku, hakemus)
      setSentEmails(sentEmails)
      setFormErrorMessage(undefined)
      cancelForm()
    } catch (err: any) {
      if (err.name === 'HttpResponseError' && err.response.status === 400) {
        setFormErrorMessage(err.response.data.error)
      } else {
        setFormErrorMessage('Muistutusviestin lähetys epäonnistui')
      }
    }
  }

  function cancelForm() {
    setEmail(initialEmail)
    setShowEmailForm(false)
    setFormErrorMessage(undefined)
  }
  return (
    <>
      <div
        className={cn('writeMuistutusviesti', {
          ['noBottomBorder']: showEmailForm || containsSentEmails,
        })}
      >
        <h2>Muistutusviesti</h2>
        <button onClick={() => openOrRevealEmailForm()} className="writeMuistutusviestiButton">
          Kirjoita
        </button>
      </div>
      <ViestiLista messages={sentEmails} />
      {showEmailForm && (
        <MultipleRecipentEmailForm
          ref={emailFormRef}
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
          errorText={formErrorMessage}
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
  const receivers = [contactEmail, trustedContactEmail].filter(isString)
  const initialEmail = {
    lang,
    subject: '',
    content: '',
    receivers: receivers,
  }
  return initialEmail
}
