import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'

import HttpUtil, { HttpResponseError } from 'soresu-form/web/HttpUtil'
import { Language } from 'soresu-form/web/va/i18n/translations'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import './muistutusviesti.less'
import ViestiLista, { Message } from './ViestiLista'
import { Lahetys } from '../haku-details/Tapahtumaloki'
import { useHakemus } from '../hakemustenArviointi/useHakemus'
import { useAvustushakuId } from '../hakemustenArviointi/useAvustushaku'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  lang: Language
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

function isString(value: unknown): value is string {
  return typeof value === 'string'
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

const mapEmails = ({ user_name, email_content }: Lahetys): Message | Message[] => {
  if (!email_content) {
    return []
  }
  return {
    date: new Date(email_content.created_at),
    id: email_content.id,
    message: email_content.formatted,
    receivers: email_content.to_address,
    sender: email_content.from_address,
    subject: email_content.subject,
    virkailija: user_name,
  }
}

async function fetchSentEmails(avustushaku: Avustushaku, hakemus: Hakemus): Promise<Message[]> {
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushaku.id}/hakemus/${hakemus.id}/tapahtumaloki/loppuselvitys-muistutus`
  )
  const mappedEmails: Message[] = sentEmails.flatMap(mapEmails)
  return mappedEmails
}

function createInitialTaydennyspyyntoEmail(hakemus: Hakemus) {
  const contactEmail = hakemus.normalizedData?.['contact-email']
  const trustedContactEmail = hakemus.normalizedData?.['trusted-contact-email']
  return {
    lang: hakemus.language,
    subject: '',
    content: '',
    receivers: [contactEmail, trustedContactEmail].filter(isString),
  }
}

async function fetchSentTaydennyspyyntoEmails(
  avustushakuId: number,
  hakemusId: number
): Promise<Message[]> {
  const sentEmails = await HttpUtil.get<Lahetys[]>(
    `/api/avustushaku/${avustushakuId}/hakemus/${hakemusId}/tapahtumaloki/taydennyspyynto-asiatarkastus`
  )
  return sentEmails.flatMap(mapEmails)
}

export function Taydennyspyynto({ disabled }: { disabled: boolean }) {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const [sentEmails, setSentEmails] = useState<Message[]>([])
  const [showEmailForm, setShowEmailForm] = useState(false)
  const emailFormRef = useRef<HTMLDivElement>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string>()
  const [email, setEmail] = useState(createInitialTaydennyspyyntoEmail(hakemus))
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  useEffect(() => {
    async function fetchEmails() {
      const mails = await fetchSentTaydennyspyyntoEmails(avustushakuId, hakemus.id)
      setSentEmails(mails)
    }
    void fetchEmails()
  }, [])
  useEffect(() => {
    if (showEmailForm) {
      revealEmailForm() // reveal after showEmailForm changes to true and component is mounted
    }
  }, [showEmailForm])
  function openOrRevealEmailForm() {
    setShowEmailForm(true)
    revealEmailForm() // try reveal here, only works when form is open, therefore the component is already mounted
  }
  function cancelForm() {
    setEmail(createInitialTaydennyspyyntoEmail(hakemus))
    setShowEmailForm(false)
    setFormErrorMessage(undefined)
  }
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    e.stopPropagation()
    try {
      await HttpUtil.post(
        `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/taydennyspyynto`,
        {
          lang: email.lang,
          type: 'taydennyspyynto-asiatarkastus',
          body: email.content,
          subject: email.subject,
          to: email.receivers,
        }
      )
      const emails = await fetchSentTaydennyspyyntoEmails(avustushakuId, hakemus.id)
      setSentEmails(emails)
      setFormErrorMessage(undefined)
      cancelForm()
    } catch (err) {
      if (err instanceof HttpResponseError && err.response.status === 400) {
        setFormErrorMessage(err.response.data.error)
      } else {
        setFormErrorMessage('Täydennyspyynnön lähetys epäonnistui')
      }
    }
  }
  return (
    <>
      <div className={cn('writeMuistutusviesti', {})}>
        <h2>Loppuselvityksen asiatarkastus</h2>
        <div>
          <button
            disabled={disabled}
            onClick={openOrRevealEmailForm}
            className="writeMuistutusviestiButton"
          >
            Täydennyspyyntö
          </button>
          <button disabled={disabled}>Hyväksy</button>
        </div>
      </div>
      <ViestiLista messages={sentEmails} />
      {showEmailForm && (
        <MultipleRecipentEmailForm
          ref={emailFormRef}
          onSubmit={onSubmit}
          email={email}
          setEmail={setEmail}
          formName="loppuselvitys-taydennyspyynto-asiatarkastus"
          submitText="Lähetä täydennyspyyntö"
          heading="Asiatarkastuksen täydennyspyyntö"
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

export function Taloustarkastus({ disabled }: { disabled: boolean }) {
  return (
    <div className={cn('writeMuistutusviesti', {})}>
      <h2>Loppuselvityksen taloustarkastus</h2>
      <div>
        <button disabled={disabled} className="writeMuistutusviestiButton">
          Täydennyspyyntö
        </button>
        <button disabled={disabled}>Hyväksy</button>
      </div>
    </div>
  )
}
