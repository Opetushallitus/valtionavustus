import React, { useEffect, useRef, useState } from 'react'
import { translations } from 'soresu-form/web/va/i18n/translations'
import cn from 'classnames'

import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

import MultipleRecipentEmailForm, {
  Email,
  generateInitialEmail,
} from '../common-components/MultipleRecipentsEmailForm'
import ViestiLista, { Message } from '../ViestiLista'
import { fetchSentEmails, sendEmail } from '../sentEmails'

import './muistutusviesti.css'
import { useEnvironment, useUserInfo } from '../../../initial-data-context'

type MuistutusviestiProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
}

async function fetchMuistutusViestiSentEmails(avustushaku: Avustushaku, hakemus: Hakemus) {
  return fetchSentEmails(avustushaku, hakemus, 'loppuselvitys-muistutus')
}

export default function MuistutusViesti({ avustushaku, hakemus }: MuistutusviestiProps) {
  const user = useUserInfo()
  const [sentEmails, setSentEmails] = useState<Message[]>([])
  const [formErrorMessage, setFormErrorMessage] = useState<string>()
  const containsSentEmails = sentEmails.length > 0
  const initialEmail = generateInitialEmail(hakemus)

  const asiatunnus = hakemus['register-number'] || ''
  const hakemusNimi = hakemus['project-name']

  const userKey = hakemus['user-key']
  const environment = useEnvironment()
  const publicUrl = `${environment['hakija-server'].url[initialEmail.lang]}avustushaku/${avustushaku.id
    }/loppuselvitys?hakemus=${userKey}`
  const loppuselvitysNimi = `${asiatunnus} ${hakemusNimi}`.trim()
  const reminderEmail: Email = {
    ...initialEmail,
    header: translations[initialEmail.lang].muistutusviesti.header(loppuselvitysNimi),
    footer: translations[initialEmail.lang].muistutusviesti.footer(
      publicUrl,
      `${user['first-name']} ${user.surname}`,
      user.email
    ),
    subject: translations[initialEmail.lang].muistutusviesti.subject(loppuselvitysNimi),
    content: translations[initialEmail.lang].muistutusviesti.content,
  }

  const [email, setEmail] = useState(reminderEmail)

  useEffect(() => {
    async function fetchEmails() {
      const sentEmails = await fetchMuistutusViestiSentEmails(avustushaku, hakemus)
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
    const { header = '', content, footer = '' } = email
    const emailContent = `${header}

${content}

${footer}`.trim()
    try {
      await sendEmail(
        'loppuselvitys-muistutus',
        avustushaku,
        hakemus,
        emailContent,
        email.subject,
        email.receivers
      )

      const sentEmails = await fetchMuistutusViestiSentEmails(avustushaku, hakemus)
      setSentEmails(sentEmails)
      setFormErrorMessage(undefined)
      cancelForm()
    } catch (err: any) {
      if (err?.name === 'HttpResponseError' && err?.response?.status === 400) {
        setFormErrorMessage(err.response.data.error)
      } else {
        setFormErrorMessage('Muistutusviestin lähetys epäonnistui')
      }
    }
  }

  function cancelForm() {
    setEmail(reminderEmail)
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
          preview={true}
        />
      )}
    </>
  )
}
