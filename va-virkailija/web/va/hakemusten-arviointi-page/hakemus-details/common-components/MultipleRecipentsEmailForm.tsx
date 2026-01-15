import React, { ForwardedRef, ReactElement, forwardRef, useId, useState } from 'react'
import { isString } from 'lodash'

import { IconTrashcan } from 'soresu-form/web/va/img/IconTrashcan'
import { Hakemus, Language } from 'soresu-form/web/va/types'

import { useUserInfo } from '../../../initial-data-context'
import * as styles from './MultipleRecipentsEmailForm.module.css'
import { initialRecipientEmails } from '../emailRecipients'

export type Email = {
  lang: Language
  subject: string
  header?: string
  content: string
  footer?: string
  receivers: string[]
}

type CancelButton = {
  text: string
  onClick: () => void
}

export function generateInitialEmail(hakemus: Hakemus): Email {
  const initialEmails = initialRecipientEmails(hakemus, hakemus.normalizedData)
  const receivers = initialEmails.filter(isString)
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
  preview?: boolean
}

function MultipleRecipentEmailForm(
  {
    heading,
    disabled: disabledProp = false,
    email,
    onSubmit: onSubmitProp,
    setEmail,
    submitText,
    formName,
    disabledSubmitButton,
    cancelButton: cancelButtonProp,
    errorText,
    preview,
  }: Props,
  ref: ForwardedRef<HTMLDivElement>
) {
  const loggedInUser = useUserInfo()
  const [isPreviewing, setPreviewing] = useState<boolean>(false)

  const setPreviewMode = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setPreviewing(true)
  }

  const onSubmit = (e: React.FormEvent<HTMLFormElement>): void => {
    e.preventDefault()
    e.stopPropagation()
    onSubmitProp(e)
    setPreviewing(false)
  }
  const handleSubmit = preview && !isPreviewing ? setPreviewMode : onSubmit
  const handleContentChange = (content: string) => setEmail((email) => ({ ...email, content }))

  const subjectId = useId()

  const disabled = disabledProp || isPreviewing
  const cancelButton: CancelButton | undefined =
    preview && isPreviewing
      ? {
          text: 'Peruuta',
          onClick() {
            setPreviewing(false)
          },
        }
      : cancelButtonProp

  return (
    <div ref={ref} data-test-id={`${formName}-email`} className={styles.form}>
      <form onSubmit={handleSubmit} className="soresu-form">
        <div className={styles.formBody}>
          {heading && <h2 className={styles.formHeader}>{heading}</h2>}
          <fieldset>
            <legend>Reply-To</legend>
            <input
              data-test-id={'email-form-message-reply-to'}
              type="text"
              name="sender"
              disabled={true}
              value={loggedInUser.email}
            />
          </fieldset>
          <MultipleEmailRecipents
            disabled={disabled}
            email={email}
            setEmail={setEmail}
            formName={formName}
          />
          <fieldset disabled={disabled}>
            <label htmlFor={subjectId}>Aihe</label>
            <input
              id={subjectId}
              data-test-id={`${formName}-email-subject`}
              onChange={(e) => setEmail({ ...email, subject: e.target.value })}
              type="text"
              name="subject"
              value={email.subject}
              required
            />
            <EmailContent
              onContentChange={handleContentChange}
              email={email}
              formName={formName}
              isPreviewing={isPreviewing}
            />
          </fieldset>
        </div>
        <SubmitContainer
          submitText={preview && !isPreviewing ? 'Esikatsele' : submitText}
          disabled={disabledProp}
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
        <div className={styles.formFooter}>
          <div>
            <button
              disabled={disabled}
              data-test-id={`${formName}-submit`}
              type="submit"
              name={`submit-${formName}`}
            >
              {submitText}
            </button>
            <span className={styles.errorMessage}>{errorText}</span>
          </div>
          {cancelButton && (
            <button type="button" className={styles.cancelButton} onClick={cancelButton.onClick}>
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
  onContentChange,
  formName,
  isPreviewing,
}: {
  onContentChange: (content: string) => void
  email: Email
  formName: string
  isPreviewing: boolean
}) {
  const contentId = useId()

  const completeContent = [email.header, email.content, email.footer].join('\n\n')
  const content = isPreviewing ? completeContent : email.content

  return (
    <>
      <label htmlFor={contentId}>Sisältö</label>
      {!isPreviewing && email.header && (
        <pre data-test-id={`${formName}-email-header`} className={styles.emailFixedContent}>
          {email.header}
        </pre>
      )}
      <textarea
        id={contentId}
        data-test-id={`${formName}-email-content`}
        onChange={(e) => onContentChange(e.target.value)}
        rows={13}
        name="content"
        value={content}
        disabled={isPreviewing}
        required
      />
      {!isPreviewing && email.footer && (
        <pre data-test-id={`${formName}-email-footer`} className={styles.emailFixedContent}>
          {email.footer}
        </pre>
      )}
    </>
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
          <div className={styles.formReceiverRow} key={idx}>
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
                className={styles.formTrashcan}
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
          className={styles.formAddReceiver}
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
