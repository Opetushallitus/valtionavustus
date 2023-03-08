import React from 'react'

import { FormikHook } from 'soresu-form/web/va/types/muutoshakemus'
import { getInputErrorClass } from 'soresu-form/web/va/formikHelpers'

import { ErrorMessage } from '../../ErrorMessage'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'

interface ContactPersonProps {
  avustushakuName: string
  projectName: string
  registerNumber?: string
  f: FormikHook
}

export const ContactPerson = ({
  avustushakuName,
  projectName,
  registerNumber,
  f,
}: ContactPersonProps) => {
  const { t } = useTranslations()

  return (
    <>
      <div className="muutoshakemus__page-title">
        <h1 className="muutoshakemus__title">
          {t.contactPersonEdit.haku}: <span data-test-id="avustushaku-name">{avustushakuName}</span>
        </h1>
      </div>
      <div className="muutoshakemus__form">
        <div className="muutoshakemus__form-row">
          <div className="muutoshakemus__form-cell">
            <div className="muutoshakemus__hanke-name__title">{t.contactPersonEdit.hanke}</div>
            <div className="muutoshakemus__hanke-name__name" data-test-id="project-name">
              {projectName}
            </div>
          </div>
        </div>
        <div className="muutoshakemus__form-row">
          <div className="muutoshakemus__form-cell">
            <div className="muutoshakemus__hanke-name__title" data-test-id="register-number-title">
              {t.contactPersonEdit.registerNumberTitle}
            </div>
            <div className="muutoshakemus__hanke-name__name" data-test-id="register-number">
              {registerNumber}
            </div>
          </div>
        </div>
        <div className="muutoshakemus__form-row">
          <div className="muutoshakemus__form-cell">
            <label className="muutoshakemus__label" htmlFor="muutoshakemus__contact-person">
              {t.contactPersonEdit.contactPerson}
            </label>
            <input
              id="muutoshakemus__contact-person"
              className="muutoshakemus__input muutoshakemus__input--contact"
              name="name"
              type="text"
              onChange={f.handleChange}
              onBlur={f.handleBlur}
              value={f.values.name}
            />
          </div>
          <div className="muutoshakemus__form-cell">
            <label className="muutoshakemus__label" htmlFor="muutoshakemus__email">
              {t.contactPersonEdit.email}
            </label>
            <input
              id="muutoshakemus__email"
              name="email"
              type="text"
              className={`${getInputErrorClass(
                f,
                'email',
                'muutoshakemus__input',
                'muutoshakemus__input-error'
              )}  muutoshakemus__input--contact`}
              onChange={f.handleChange}
              onBlur={f.handleBlur}
              value={f.values.email}
            />
            <ErrorMessage text={f.errors.email} />
          </div>
          <div className="muutoshakemus__form-cell">
            <label className="muutoshakemus__label" htmlFor="muutoshakemus__phone">
              {t.contactPersonEdit.phone}
            </label>
            <input
              id="muutoshakemus__phone"
              className="muutoshakemus__input muutoshakemus__input--contact"
              name="phone"
              type="text"
              onChange={f.handleChange}
              onBlur={f.handleBlur}
              value={f.values.phone}
            />
          </div>
        </div>
      </div>
    </>
  )
}
