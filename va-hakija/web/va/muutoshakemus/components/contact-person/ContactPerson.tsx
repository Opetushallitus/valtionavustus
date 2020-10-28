import React, {ChangeEvent} from 'react'
import {useTranslations} from '../../TranslationContext'
import {
  AppContext,
} from '../../store/context'
import {Types} from '../../store/reducers'
import { Hakemus, Language } from '../../types'

interface ContactPersonProps {
  avustushaku?: any
  hakemus: Hakemus,
  lang: Language
}

export const ContactPerson = ({hakemus, avustushaku, lang}: ContactPersonProps) => {
  const { t } = useTranslations()
  const { state, dispatch } = React.useContext(AppContext)


  function getContactPersonNameFromStateOrDefault() {
    return state.contactPerson.localState?.name ||
    hakemus["contact-person"]
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

  return (
  <section>
    <div className="muutoshaku__page-title">
      <h1 className="muutoshaku__title">{t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushaku?.content?.name?.[lang]}</span></h1>
      <span className="va-register-number">
        <span className="muutoshaku__register-number">{t.contactPersonEdit.registerNumberTitle}: </span>
        <span data-test-id="register-number">{avustushaku?.["register-number"]}</span>
      </span>
    </div>
    <div className="muutoshaku__form">
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <div>{t.contactPersonEdit.hanke}</div>
          <div data-test-id="project-name">{hakemus['project-name']}</div>
        </div>
      </div>
      <div className="muutoshaku__form-row">
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input 
            id="muutoshaku__contact-person" 
            type="text" 
            onChange={onChangeContactPersonName}
            value={getContactPersonNameFromStateOrDefault()} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__email">{t.contactPersonEdit.email}</label>
          <input id="muutoshaku__email" type="text" defaultValue={hakemus['contact-email']} />
        </div>
        <div className="muutoshaku__form-cell">
          <label htmlFor="muutoshaku__phone">{t.contactPersonEdit.phone}</label>
          <input id="muutoshaku__phone" type="text" defaultValue={hakemus['contact-phone']}/>
        </div>
      </div>
    </div>
  </section>
  )
}
