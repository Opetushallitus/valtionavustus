import React from 'react'

import { FormikHook } from 'va-common/web/va/types/muutoshakemus'

import { ErrorMessage } from '../../ErrorMessage'
import { getInputErrorClass } from '../../formikHelpers'
import { useTranslations } from '../../TranslationContext'

interface ContactPersonProps {
  avustushakuName: string
  projectName: string
  registerNumber: string
  f: FormikHook
}

export const ContactPerson = ({ avustushakuName, projectName, registerNumber, f}: ContactPersonProps) => {
  const { t } = useTranslations()

  return (
  <section className="muutoshakemus__section">
    <div className="muutoshakemus__page-title">
      <h1 className="muutoshakemus__title">{t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushakuName}</span></h1>
      <span className="va-register-number">
        <span className="muutoshakemus__register-number">{t.contactPersonEdit.registerNumberTitle}: </span>
        <span data-test-id="register-number">{registerNumber}</span>
      </span>
    </div>
    <div className="muutoshakemus__form">
      <div className="muutoshakemus__form-row">
        <div className="muutoshakemus__form-cell">
          <div>{t.contactPersonEdit.hanke}</div>
          <div data-test-id="project-name">{projectName}</div>
        </div>
      </div>
      <div className="muutoshakemus__form-row">
        <div className="muutoshakemus__form-cell">
          <label htmlFor="muutoshakemus__contact-person">{t.contactPersonEdit.contactPerson}</label>
          <input
            id="muutoshakemus__contact-person"
            name="name"
            type="text"
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            value={f.values.name} />
        </div>
        <div className="muutoshakemus__form-cell">
          <label htmlFor="muutoshakemus__email">{t.contactPersonEdit.email}</label>
          <input
            id="muutoshakemus__email"
            name="email"
            type="text"
            className={getInputErrorClass(f, 'email')}
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            value={f.values.email} />
          <ErrorMessage text={f.errors.email} />
        </div>
        <div className="muutoshakemus__form-cell">
          <label htmlFor="muutoshakemus__phone">{t.contactPersonEdit.phone}</label>
          <input
            id="muutoshakemus__phone"
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
