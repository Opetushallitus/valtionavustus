import React, { ForwardedRef, ReactElement, forwardRef } from 'react'
import { isString } from 'lodash'

import { IconTrashcan } from 'soresu-form/web/va/img/IconTrashcan'
import { Hakemus, Language } from 'soresu-form/web/va/types'

import './MultipleRecipentsEmailForm.less'

export type Email = {
  lang: Language
  subject: string
  content: string
  receivers: string[]
}

type CancelButton = {
  text: string
  onClick: () => void
}

export function generateInitialEmail(hakemus: Hakemus): Email {
  const contactEmail = hakemus.normalizedData?.['contact-email']
  const trustedContactEmail = hakemus.normalizedData?.['trusted-contact-email']

  const receivers = [contactEmail, trustedContactEmail].filter(isString)
  return {
    lang: hakemus.language,
    subject: '',
    content: '',
    receivers,
  }
}

type Props = {
  heading?: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  email: Email
  setEmail: React.Dispatch<React.SetStateAction<Email>>
  submitText: string
  formName: string
  disabled?: boolean
  disabledSubmitButton?: ReactElement
  cancelButton?: CancelButton
  errorText?: string
}

function MultipleRecipentEmailForm(
  {
    heading,
    disabled = false,
    email,
    onSubmit,
    setEmail,
    submitText,
    formName,
    disabledSubmitButton,
    cancelButton,
    errorText,
  }: Props,
  ref: ForwardedRef<HTMLDivElement>
) {
  return (
    <div ref={ref} data-test-id={`${formName}-email`} className="form">
      <form onSubmit={onSubmit} className="soresu-form">
        <div className="form-body">
          {heading && <h2 className="form-header">{heading}</h2>}
          <fieldset>
            <legend>Lähettäjä</legend>
            <input
              data-test-id={'email-form-message-sender'}
              type="text"
              name="sender"
              disabled={true}
              value="no-reply@oph.fi"
            />
          </fieldset>
          <MultipleEmailRecipents
            disabled={disabled}
            email={email}
            setEmail={setEmail}
            formName={formName}
          />
          <EmailContent disabled={disabled} setEmail={setEmail} email={email} formName={formName} />
        </div>
        <SubmitContainer
          submitText={submitText}
          disabled={disabled}
          disabledComponent={disabledSubmitButton}
          formName={formName}
          cancelButton={cancelButton}
          errorText={errorText}
        />
      </form>
    </div>
  )
}

function SubmitContainer({
  submitText,
  disabled,
  formName,
  disabledComponent,
  cancelButton,
  errorText,
}: {
  submitText: string
  disabled: boolean
  formName: string
  disabledComponent?: ReactElement
  cancelButton?: CancelButton
  errorText?: string
}) {
  const DisabledComponent = () => disabledComponent
  return (
    <div data-test-id={formName}>
      {disabled && disabledComponent ? (
        <DisabledComponent />
      ) : (
        <div className="form-footer">
          <div>
            <button
              disabled={disabled}
              data-test-id={`${formName}-submit`}
              type="submit"
              name={`submit-${formName}`}
            >
              {submitText}
            </button>
            <span className="error-message">{errorText}</span>
          </div>
          {cancelButton && (
            <button type="button" className="cancelButton" onClick={cancelButton.onClick}>
              {cancelButton.text}
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function EmailContent({
  email,
  setEmail,
  disabled,
  formName,
}: {
  disabled: boolean
  setEmail: React.Dispatch<
    React.SetStateAction<{ lang: Language; subject: string; content: string; receivers: any[] }>
  >
  email: { lang: Language; subject: string; content: string; receivers: any[] }
  formName: string
}) {
  return (
    <fieldset disabled={disabled}>
      <label htmlFor="multirecipientemailform-subject">Aihe</label>
      <input
        id="multirecipientemailform-subject"
        data-test-id={`${formName}-email-subject`}
        onChange={(e) => setEmail({ ...email, subject: e.target.value })}
        type="text"
        name="subject"
        value={email.subject}
        required
      />
      <label htmlFor="multirecipientemailform-content">Sisältö</label>
      <textarea
        id="multirecipientemailform-content"
        data-test-id={`${formName}-email-content`}
        onChange={(e) => setEmail({ ...email, content: e.target.value })}
        rows={13}
        name="content"
        value={email.content}
        required
      />
    </fieldset>
  )
}

function MultipleEmailRecipents({
  disabled,
  email,
  setEmail,
  formName,
}: {
  disabled: boolean
  email: Email
  setEmail: React.Dispatch<React.SetStateAction<Email>>
  formName: string
}) {
  const { receivers } = email
  return (
    <fieldset disabled={disabled}>
      <legend>Vastaanottajat</legend>
      {receivers.map((address, idx) => {
        return (
          <div className={`form-receiver-row`} key={idx}>
            <input
              data-test-id={`${formName}-receiver-${idx}`}
              type="email"
              name="receiver"
              required
              onChange={(e) => {
                const newReceivers = [...receivers]
                newReceivers[idx] = e.target.value
                setEmail({ ...email, receivers: newReceivers })
              }}
              value={address}
            />
            {!disabled && receivers.length > 1 && (
              <span
                className={'form-trashcan'}
                onClick={() => {
                  const newReceivers = [...receivers]
                  newReceivers.splice(idx, 1)
                  setEmail({ ...email, receivers: newReceivers })
                }}
              >
                <IconTrashcan />
              </span>
            )}
          </div>
        )
      })}
      {!disabled && (
        <button
          data-test-id={`${formName}-add-receiver`}
          type="button"
          className="form-add-receiver"
          onClick={() => {
            setEmail({ ...email, receivers: [...receivers, ''] })
          }}
        >
          + Lisää uusi vastaanottaja
        </button>
      )}
    </fieldset>
  )
}

export default forwardRef(MultipleRecipentEmailForm)
