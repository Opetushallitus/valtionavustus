import React from 'react'
import { getIn } from 'formik'

import { FormikHook, YhteishankeOrganization } from 'soresu-form/web/va/types/muutoshakemus'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'
import { getNestedInputErrorClass } from 'soresu-form/web/va/formikHelpers'
import { ErrorMessage } from '../../ErrorMessage'

type YhteishankeOrganizationChangesProps = {
  f: FormikHook
  originalOrganizations: YhteishankeOrganization[]
}

export const YhteishankeOrganizationChanges = ({
  f,
  originalOrganizations,
}: YhteishankeOrganizationChangesProps) => {
  const { t } = useTranslations()
  const organizations = f.values.yhteishankkeenOsapuolimuutokset

  const getError = (field: string): string | undefined => {
    const touched = getIn(f.touched, field)
    const error = getIn(f.errors, field)
    return touched && typeof error === 'string' ? error : undefined
  }

  const setOrganizations = (nextOrganizations: YhteishankeOrganization[]) => {
    f.setFieldValue('yhteishankkeenOsapuolimuutokset', nextOrganizations)
  }

  const resetOrganizations = () => {
    setOrganizations(
      originalOrganizations.map((organization) => ({
        organizationName: organization.organizationName,
        contactPerson: organization.contactPerson,
        email: organization.email,
        isNew: false,
        sourceIndex: organization.sourceIndex,
      }))
    )
  }

  const addOrganization = () => {
    setOrganizations([
      ...organizations,
      {
        organizationName: '',
        contactPerson: '',
        email: '',
        isNew: true,
      },
    ])
  }

  const removeOrganization = (indexToRemove: number) => {
    setOrganizations(organizations.filter((_, index) => index !== indexToRemove))
  }

  return (
    <div className="muutoshakemus__yhteishanke-organization-changes">
      <div className="muutoshakemus__section-action-row">
        <button
          className="muutoshakemus__button"
          type="button"
          onClick={addOrganization}
          data-test-id="add-yhteishanke-organization-change"
        >
          {t.contactPersonEdit.addYhteishankeOrganization}
        </button>
        <button
          className="muutoshakemus__button"
          type="button"
          onClick={resetOrganizations}
          data-test-id="reset-yhteishanke-organization-changes"
        >
          {t.contactPersonEdit.resetYhteishankeOrganizations}
        </button>
      </div>
      <div className="muutoshakemus__yhteishanke-organizations">
        {organizations.map((organization, index) => {
          const organizationNameField = `yhteishankkeenOsapuolimuutokset.${index}.organizationName`
          const contactPersonField = `yhteishankkeenOsapuolimuutokset.${index}.contactPerson`
          const emailField = `yhteishankkeenOsapuolimuutokset.${index}.email`
          const idPrefix = `yhteishankkeen-osapuolimuutokset-${index + 1}`
          const readOnly = !organization.isNew

          return (
            <div className="muutoshakemus__form-row" key={organizationNameField}>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor={`${idPrefix}-name`}>
                  {`${index + 1}. ${t.contactPersonEdit.yhteishankeOrganizationName}`}
                </label>
                <input
                  id={`${idPrefix}-name`}
                  className={`${getNestedInputErrorClass(f, [
                    'yhteishankkeenOsapuolimuutokset',
                    `${index}`,
                    'organizationName',
                  ])} muutoshakemus__input muutoshakemus__input--contact${
                    readOnly ? ' muutoshakemus__input--readonly' : ''
                  }`}
                  name={organizationNameField}
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={organization.organizationName}
                  readOnly={readOnly}
                />
                <ErrorMessage text={getError(organizationNameField)} />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor={`${idPrefix}-contactperson`}>
                  {t.contactPersonEdit.yhteishankeContactPerson}
                </label>
                <input
                  id={`${idPrefix}-contactperson`}
                  className={`${getNestedInputErrorClass(f, [
                    'yhteishankkeenOsapuolimuutokset',
                    `${index}`,
                    'contactPerson',
                  ])} muutoshakemus__input muutoshakemus__input--contact${
                    readOnly ? ' muutoshakemus__input--readonly' : ''
                  }`}
                  name={contactPersonField}
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={organization.contactPerson}
                  readOnly={readOnly}
                />
                <ErrorMessage text={getError(contactPersonField)} />
              </div>
              <div className="muutoshakemus__form-cell">
                <label className="muutoshakemus__label" htmlFor={`${idPrefix}-email`}>
                  {t.contactPersonEdit.yhteishankeEmail}
                </label>
                <input
                  id={`${idPrefix}-email`}
                  className={`${getNestedInputErrorClass(f, [
                    'yhteishankkeenOsapuolimuutokset',
                    `${index}`,
                    'email',
                  ])} muutoshakemus__input muutoshakemus__input--contact${
                    readOnly ? ' muutoshakemus__input--readonly' : ''
                  }`}
                  name={emailField}
                  type="text"
                  onChange={f.handleChange}
                  onBlur={f.handleBlur}
                  value={organization.email}
                  readOnly={readOnly}
                />
                <ErrorMessage text={getError(emailField)} />
              </div>
              <div className="muutoshakemus__form-cell muutoshakemus__form-cell--actions">
                <button
                  className="muutoshakemus__button muutoshakemus__button--danger"
                  type="button"
                  onClick={() => removeOrganization(index)}
                  data-test-id={`remove-yhteishanke-organization-change-${index + 1}`}
                >
                  {t.contactPersonEdit.removeYhteishankeOrganization}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
