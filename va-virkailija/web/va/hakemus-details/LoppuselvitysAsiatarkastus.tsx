import { Hakemus } from 'soresu-form/web/va/types'
import ViestiLista from './ViestiLista'
import { useHakemus } from '../hakemustenArviointi/useHakemus'
import { useAvustushakuId } from '../hakemustenArviointi/useAvustushaku'
import React, { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import MultipleRecipentEmailForm from './MultipleRecipentsEmailForm'
import { isString } from 'lodash'
import {
  EmailType,
  useGetTapahtumalokiForEmailTypeQuery,
  usePostLoppuselvitysTaydennyspyyntoMutation,
} from '../hakemustenArviointi/apiSlice'
import { hasFetchErrorMsg } from '../isFetchBaseQueryError'

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

export function Asiatarkastus({ disabled }: { disabled: boolean }) {
  return (
    <LoppuselvitysTarkastus
      taydennyspyyntoType="taydennyspyynto-asiatarkastus"
      disabled={disabled}
      heading="Loppuselvityksen asiatarkastus"
      taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
      confirmButtonText="Hyväksy"
    />
  )
}

export function Taloustarkastus({ disabled }: { disabled: boolean }) {
  return (
    <LoppuselvitysTarkastus
      taydennyspyyntoType="taydennyspyynto-taloustarkastus"
      disabled={disabled}
      heading="Loppuselvityksen taloustarkastus"
      taydennyspyyntoHeading="Taloustarkastuksen täydennyspyyntö"
      confirmButtonText="Hyväksy"
    />
  )
}

interface LoppuselvitysTarkastusProps {
  taydennyspyyntoType: EmailType
  disabled: boolean
  heading: string
  taydennyspyyntoHeading: string
  confirmButtonText: string
}

function LoppuselvitysTarkastus({
  disabled,
  heading,
  taydennyspyyntoHeading,
  taydennyspyyntoType,
  confirmButtonText,
}: LoppuselvitysTarkastusProps) {
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const { data: sentEmails } = useGetTapahtumalokiForEmailTypeQuery({
    hakemusId: hakemus.id,
    avustushakuId,
    emailType: taydennyspyyntoType,
  })
  const [addTaydennyspyynto] = usePostLoppuselvitysTaydennyspyyntoMutation()
  const [showEmailForm, setShowEmailForm] = useState(false)
  const emailFormRef = useRef<HTMLDivElement>(null)
  const [formErrorMessage, setFormErrorMessage] = useState<string>()
  const [email, setEmail] = useState(createInitialTaydennyspyyntoEmail(hakemus))
  const revealEmailForm = () => emailFormRef.current?.scrollIntoView({ behavior: 'smooth' })
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
      await addTaydennyspyynto({
        hakemusId: hakemus.id,
        avustushakuId,
        email: {
          lang: email.lang,
          type: taydennyspyyntoType,
          body: email.content,
          subject: email.subject,
          to: email.receivers,
        },
      }).unwrap()
      setFormErrorMessage(undefined)
      cancelForm()
    } catch (err) {
      if (hasFetchErrorMsg(err)) {
        setFormErrorMessage(err.data.error)
      } else {
        setFormErrorMessage('Täydennyspyynnön lähetys epäonnistui')
      }
    }
  }
  return (
    <>
      <div className={cn('writeMuistutusviesti', {})}>
        <h2>{heading}</h2>
        <div>
          <button
            onClick={openOrRevealEmailForm}
            disabled={disabled}
            className="writeMuistutusviestiButton"
          >
            Täydennyspyyntö
          </button>
          <button disabled={disabled}>{confirmButtonText}</button>
        </div>
      </div>
      <ViestiLista messages={sentEmails ?? []} />
      {showEmailForm && (
        <MultipleRecipentEmailForm
          ref={emailFormRef}
          onSubmit={onSubmit}
          email={email}
          setEmail={setEmail}
          formName={`loppuselvitys-${taydennyspyyntoType}`}
          submitText="Lähetä täydennyspyyntö"
          heading={taydennyspyyntoHeading}
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
