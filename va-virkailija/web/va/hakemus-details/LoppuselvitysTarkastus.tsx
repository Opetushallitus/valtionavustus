import { Hakemus } from 'soresu-form/web/va/types'
import ViestiLista, { ViestiListaRow } from './ViestiLista'
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
} from '../apiSlice'
import { hasFetchErrorMsg } from '../isFetchBaseQueryError'
import HttpUtil from 'soresu-form/web/HttpUtil'
import { refreshHakemukset } from '../hakemustenArviointi/arviointiReducer'
import { useHakemustenArviointiDispatch } from '../hakemustenArviointi/arviointiStore'

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
  const [showConfirmation, setShowConfirmation] = useState(false)
  const dispatch = useHakemustenArviointiDispatch()
  const hakemus = useHakemus()
  const avustushakuId = useAvustushakuId()
  const verifiedBy = hakemus['loppuselvitys-information-verified-by']
  const verifiedAt = hakemus['loppuselvitys-information-verified-at']
  const verification = hakemus['loppuselvitys-information-verification']
  const onSubmit = async () => {
    await HttpUtil.post(
      `/api/avustushaku/${avustushakuId}/hakemus/${hakemus.id}/loppuselvitys/verify-information`,
      { message: '' }
    )
    dispatch(
      refreshHakemukset({
        avustushakuId,
        hakemusId: hakemus.id,
      })
    )
  }
  const onClick = async (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (showConfirmation) {
      await onSubmit()
    } else {
      setShowConfirmation(true)
    }
  }
  return (
    <LoppuselvitysTarkastus
      taydennyspyyntoType="taydennyspyynto-asiatarkastus"
      disabled={disabled}
      heading="Loppuselvityksen asiatarkastus"
      taydennyspyyntoHeading="Asiatarkastuksen täydennyspyyntö"
      confirmButtonText="Hyväksy"
      confirmButton={
        <button disabled={disabled} onClick={onClick}>
          {showConfirmation ? 'Vahvista hyväksyntä' : 'Hyväksy'}
        </button>
      }
      completedBy={
        verifiedAt && verifiedBy
          ? {
              name: verifiedBy,
              date: verifiedAt,
              verification,
            }
          : undefined
      }
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
      confirmButton={<button disabled={disabled}>{'Hyväksy'}</button>}
    />
  )
}

interface LoppuselvitysTarkastusProps {
  taydennyspyyntoType: EmailType
  disabled: boolean
  heading: string
  taydennyspyyntoHeading: string
  confirmButtonText: string
  confirmButton: React.JSX.Element
  completedBy?: {
    name: string
    date: string
    verification?: string
  }
}

function LoppuselvitysTarkastus({
  disabled,
  heading,
  taydennyspyyntoHeading,
  taydennyspyyntoType,
  confirmButton,
  completedBy,
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
  const [showMessage, setShowMessage] = useState(false)

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
      <div data-test-id={taydennyspyyntoType} className={cn('writeMuistutusviesti', {})}>
        <h2>{heading}</h2>
        <div>
          <button
            onClick={openOrRevealEmailForm}
            disabled={disabled}
            className="writeMuistutusviestiButton"
          >
            Täydennyspyyntö
          </button>
          {confirmButton}
        </div>
      </div>
      <ViestiLista messages={sentEmails ?? []} />
      {completedBy && (
        <ViestiListaRow
          icon="done"
          virkailija={completedBy.name}
          date={completedBy.date}
          onClick={() => setShowMessage((show) => !show)}
          heading="Asiatarkastettu"
          dataTestId="loppuselvitys-tarkastus"
        >
          {showMessage && completedBy.verification && (
            <div className={'messageDetails'}>
              <div className={'rowMessage'}>{completedBy.verification}</div>
            </div>
          )}
        </ViestiListaRow>
      )}
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
