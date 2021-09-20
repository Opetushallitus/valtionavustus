import React from 'react'

import { FormikHook } from 'va-common/web/va/types/muutoshakemus'
import { getInputErrorClass } from 'va-common/web/va/formikHelpers'

import { ErrorMessage } from '../../ErrorMessage'
import { useTranslations } from '../../../../../../va-common/web/va/i18n/TranslationContext'

interface ContactPersonProps {
  avustushakuName: string
  projectName: string
  registerNumber: string
  f: FormikHook
  osiokohtainenEnabled: boolean
}

export const ContactPerson = ({ avustushakuName, projectName, registerNumber, f, osiokohtainenEnabled}: ContactPersonProps) => {
  const { t } = useTranslations()

  const className = osiokohtainenEnabled ? "osiokohtainen-muutoshakemus" : "muutoshakemus"
  return (
  <section className={`${className}__section`}>
    <div className={`${className}__page-title`}>
      <h1 className={`${className}__title`}>{t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushakuName}</span></h1>
      <span className="va-register-number">
        <span className={`${className}__register-number`}>{t.contactPersonEdit.registerNumberTitle}: </span>
        <span data-test-id="register-number">{registerNumber}</span>
      </span>
    </div>
    <div className="muutoshakemus__form">
      <div className="muutoshakemus__form-row">
        <div className={`${className}__form-cell`}>
          <div className="muutoshakemus__hanke-name__title">{t.contactPersonEdit.hanke}</div>
          <div className="muutoshakemus__hanke-name__name" data-test-id="project-name">{projectName}</div>
        </div>
      </div>
      <div className="muutoshakemus__form-row">
        <div className={`${className}__form-cell`}>
          <label className={`${className}__label`} htmlFor="muutoshakemus__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input
            id="muutoshakemus__contact-person"
            className={`${className}__input`}
            name="name"
            type="text"
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            value={f.values.name} />
        </div>
        <div className={`${className}__form-cell`}>
          <label className={`${className}__label`} htmlFor="muutoshakemus__email">{t.contactPersonEdit.email}</label>
          <input
            id="muutoshakemus__email"
            name="email"
            type="text"
            className={getInputErrorClass(f, 'email', `${className}__input`, `${className}__input-error`)}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            value={f.values.email} />
          <ErrorMessage text={f.errors.email} />
        </div>
        <div className={`${className}__form-cell`}>
          <label className={`${className}__label`} htmlFor="muutoshakemus__phone">{t.contactPersonEdit.phone}</label>
          <input
            id="muutoshakemus__phone"
            className={`${className}__input`}
            name="phone"
            type="text"
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            value={f.values.phone} />
        </div>
      </div>
    </div>
  </section>
  )
}
