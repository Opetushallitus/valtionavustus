import React, {ChangeEvent} from 'react'
import {useTranslations} from '../../TranslationContext'
import {
  AppContext,
} from '../../store/context'
import {Types} from '../../store/reducers'
import { Language, EmailValidationError } from '../../types'

interface ContactPersonProps {
  avustushakuName: string
  projectName: string
  registerNumber: string
  lang: Language
}

export const ContactPerson = ({ avustushakuName, projectName, registerNumber}: ContactPersonProps) => {
  const { t } = useTranslations()
  const { state, dispatch } = React.useContext(AppContext)

  function getContactPersonNameFromLocalOrServerState() {
    return state.yhteyshenkilo?.name || state.lastSave?.yhteyshenkilo?.name
  }

  function onChangeContactPersonName(event: ChangeEvent<HTMLInputElement>): void {
    const name = event.currentTarget.value
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { name }, validationError: state.yhteyshenkilo?.validationError }
    })
  }

  function getContactPersonEmailFromLocalOrServerState() {
    return state.yhteyshenkilo?.email || state.lastSave?.yhteyshenkilo?.email
  }

  function onChangeContactPersonEmail(event: ChangeEvent<HTMLInputElement>): void {
    const email = event.currentTarget.value
    const isValid = !!email.match(/^[a-zA-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/)
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { email }, validationError: isValid ? undefined : new EmailValidationError(`Invalid email: ${email}`) }
    })
  }

  function hasEmailValidationError() {
    return state.yhteyshenkilo?.validationError instanceof EmailValidationError
  }

  function getContactPersonPhoneFromLocalOrServerState() {
    return state.yhteyshenkilo?.phone || state.lastSave?.yhteyshenkilo?.phone
  }

  function onChangeContactPersonPhone(event: ChangeEvent<HTMLInputElement>): void {
    const phone = event.currentTarget.value
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { phone }, validationError: state.yhteyshenkilo?.validationError }
    })
  }

  return (
  <section>
    <div className="muutoshaku__page-title">
      <h1 className="muutoshaku__title">{t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushakuName}</span></h1>
      <span className="va-register-number">
        <span className="muutoshaku__register-number">{t.contactPersonEdit.registerNumberTitle}: </span>
        <span data-test-id="register-number">{registerNumber}</span>
      </span>
    </div>
    <div className="muutoshaku__form">
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <div>{t.contactPersonEdit.hanke}</div>
          <div data-test-id="project-name">{projectName}</div>
        </div>
      </div>
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input
            id="muutoshaku__contact-person"
            type="text"
            onChange={onChangeContactPersonName}
            value={getContactPersonNameFromLocalOrServerState()} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__email">{t.contactPersonEdit.email}</label>
          <input
            id="muutoshaku__email"
            type="text"
            className={ hasEmailValidationError() ? "error" : undefined}
            onChange={onChangeContactPersonEmail}
            value={getContactPersonEmailFromLocalOrServerState()} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__phone">{t.contactPersonEdit.phone}</label>
          <input
            id="muutoshaku__phone"
            type="text"
            onChange={onChangeContactPersonPhone}
            value={getContactPersonPhoneFromLocalOrServerState()}/>
        </div>
      </div>
    </div>
  </section>
  )
}
