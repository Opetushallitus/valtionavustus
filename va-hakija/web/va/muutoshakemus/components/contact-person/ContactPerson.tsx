import React, {ChangeEvent} from 'react'
import {useTranslations} from '../../TranslationContext'
import {
  AppContext,
} from '../../store/context'
import {Types} from '../../store/reducers'
import { Language } from '../../types'

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
    return state.contactPerson.localState?.name ||
    state.contactPerson.serverState?.name
  }

  function onChangeContactPersonName(event: ChangeEvent<HTMLInputElement>): void {
    setContactPersonNameToState(event.currentTarget.value)
  }

  function setContactPersonNameToState(name: string) {
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { name } }
    })
  }

  function getContactPersonEmailFromLocalOrServerState() {
    return state.contactPerson.localState?.email ||
    state.contactPerson.serverState?.email
  }

  function onChangeContactPersonEmail(event: ChangeEvent<HTMLInputElement>): void {
    setContactPersonEmailToState(event.currentTarget.value)
  }

  function setContactPersonEmailToState(email: string) {
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { email } }
    })
  }

  function getContactPersonPhoneFromLocalOrServerState() {
    return state.contactPerson.localState?.phone ||
    state.contactPerson.serverState?.phone
  }

  function onChangeContactPersonPhone(event: ChangeEvent<HTMLInputElement>): void {
    setContactPersonPhoneToState(event.currentTarget.value)
  }

  function setContactPersonPhoneToState(phone: string) {
    dispatch({
      type: Types.ContactPersonFormChange,
      payload: { formState: { phone } }
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
