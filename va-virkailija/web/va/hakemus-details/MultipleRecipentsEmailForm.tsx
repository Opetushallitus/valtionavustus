import React, { ReactElement } from 'react'
import { IconTrashcan } from 'soresu-form/web/va/img/IconTrashcan'
import { Language } from 'soresu-form/web/va/types'
import './MultipleRecipentsEmailForm.less'

export type Email = { lang: Language; subject: string; content: string; receivers: string[] }

type CancelButton = {
  text: string
  onClick: () => void
}

export default function MultipleRecipentEmailForm({
  heading,
  disabled,
  email,
  onSubmit,
  setEmail,
  submitText,
  formName,
  disabledSubmitButton,
  cancelButton,
}: {
  heading: string
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  disabled: boolean
  email: Email
  setEmail: React.Dispatch<React.SetStateAction<Email>>
  submitText: string
  formName: string
  disabledSubmitButton?: ReactElement
  cancelButton?: CancelButton
}) {
  return (
    <div data-test-id={`${formName}-email`} className="form">
      <form onSubmit={onSubmit} className="soresu-form">
        <div className="form-body">
          <h2 className="form-header">{heading}</h2>
          <SenderEmail />
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
}: {
  submitText: string
  disabled: boolean
  formName: string
  disabledComponent?: ReactElement
  cancelButton?: CancelButton
}) {
  const DisabledComponent = () => disabledComponent
  return (
    <div data-test-id={formName}>
      {disabled && disabledComponent ? (
        <DisabledComponent />
      ) : (
        <div className="form-footer">
          <button
            disabled={disabled}
            data-test-id={`${formName}-submit`}
            type="submit"
            name={`submit-${formName}`}
          >
            {submitText}
          </button>
          {cancelButton && (
            <button className="cancelButton" onClick={cancelButton.onClick}>
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
      <legend>Aihe</legend>
      <input
        data-test-id={`${formName}-email-subject`}
        onChange={(e) => setEmail({ ...email, subject: e.target.value })}
        type="text"
        name="subject"
        value={email.subject}
      />
      <textarea
        data-test-id={`${formName}-email-content`}
        onChange={(e) => setEmail({ ...email, content: e.target.value })}
        rows={13}
        name="content"
        value={email.content}
      />
    </fieldset>
  )
}

function SenderEmail() {
  return (
    <fieldset>
      <legend>Lähettäjä</legend>
      <input type="text" name="sender" disabled={true} value="no-reply@oph.fi" />
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
  return (
    <fieldset disabled={disabled}>
      <legend>Vastaanottajat</legend>
      {email.receivers.map((address, idx) => {
        return (
          <div className={`form-receiver-row`} key={idx}>
            <input
              data-test-id={`${formName}-receiver-${idx}`}
              type="text"
              name="receiver"
              onChange={(e) => {
                const newReceivers = email.receivers
                newReceivers[idx] = e.target.value
                setEmail({ ...email, receivers: newReceivers })
              }}
              value={address}
            />
            {!disabled && (
              <span
                className={'form-trashcan'}
                onClick={() => {
                  const newReceivers = email.receivers
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
            setEmail({ ...email, receivers: [...email.receivers, ''] })
          }}
        >
          + Lisää uusi vastaanottaja
        </button>
      )}
    </fieldset>
  )
}
