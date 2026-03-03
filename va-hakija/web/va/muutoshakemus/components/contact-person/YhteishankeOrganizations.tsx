import React from 'react'
import { getIn } from 'formik'

import { FormikHook, YhteishankeOrganization } from 'soresu-form/web/va/types/muutoshakemus'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'
import { getNestedInputErrorClass } from 'soresu-form/web/va/formikHelpers'
import { ErrorMessage } from '../../ErrorMessage'

type YhteishankeOrganizationsProps = {
  f: FormikHook
}

export const YhteishankeOrganizations = ({ f }: YhteishankeOrganizationsProps) => {
  const { t } = useTranslations()
  const organizations: YhteishankeOrganization[] = f.values.yhteishankkeenOsapuolet

  const getError = (field: string): string | undefined => {
    const touched = getIn(f.touched, field)
    const error = getIn(f.errors, field)
    return touched && typeof error === 'string' ? error : undefined
  }

  return (
    <>
      <div className="muutoshakemus__section-checkbox-row muutoshakemus__yhteishanke-checkbox-row">
        <input
          id="checkbox-paivitanYhteishankkeenOsapuoltenYhteystietoja"
          name="paivitanYhteishankkeenOsapuoltenYhteystietoja"
          type="checkbox"
          onChange={f.handleChange}
          checked={f.values.paivitanYhteishankkeenOsapuoltenYhteystietoja}
          data-test-id="checkbox-update-yhteishanke-organizations"
        />
        <label htmlFor="checkbox-paivitanYhteishankkeenOsapuoltenYhteystietoja">
          {t.contactPersonEdit.updateYhteishankeContacts}
        </label>
      </div>
      {f.values.paivitanYhteishankkeenOsapuoltenYhteystietoja && (
        <div className="muutoshakemus__yhteishanke-organizations">
          {organizations.map((organization, index) => {
            const organizationNameField = `yhteishankkeenOsapuolet.${index}.organizationName`
            const contactPersonField = `yhteishankkeenOsapuolet.${index}.contactPerson`
            const emailField = `yhteishankkeenOsapuolet.${index}.email`
            const organizationIndex = index + 1
            const organizationNameId = `other-organizations.other-organizations-${organizationIndex}.name`
            const contactPersonId = `other-organizations.other-organizations-${organizationIndex}.contactperson`
            const emailId = `other-organizations.other-organizations-${organizationIndex}.email`
            return (
              <div className="muutoshakemus__form-row" key={organizationNameField}>
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor={organizationNameId}>
                    {`${index + 1}. ${t.contactPersonEdit.yhteishankeOrganizationName}`}
                  </label>
                  <input
                    id={organizationNameId}
                    className="muutoshakemus__input muutoshakemus__input--contact muutoshakemus__input--readonly"
                    name={organizationNameField}
                    type="text"
                    value={organization.organizationName}
                    readOnly
                  />
                </div>
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor={contactPersonId}>
                    {t.contactPersonEdit.yhteishankeContactPerson}
                  </label>
                  <input
                    id={contactPersonId}
                    className={`${getNestedInputErrorClass(f, [
                      'yhteishankkeenOsapuolet',
                      `${index}`,
                      'contactPerson',
                    ])} muutoshakemus__input muutoshakemus__input--contact`}
                    name={contactPersonField}
                    type="text"
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={organization.contactPerson}
                  />
                  <ErrorMessage text={getError(contactPersonField)} />
                </div>
                <div className="muutoshakemus__form-cell">
                  <label className="muutoshakemus__label" htmlFor={emailId}>
                    {t.contactPersonEdit.yhteishankeEmail}
                  </label>
                  <input
                    id={emailId}
                    className={`${getNestedInputErrorClass(f, [
                      'yhteishankkeenOsapuolet',
                      `${index}`,
                      'email',
                    ])} muutoshakemus__input muutoshakemus__input--contact`}
                    name={emailField}
                    type="text"
                    onChange={f.handleChange}
                    onBlur={f.handleBlur}
                    value={organization.email}
                  />
                  <ErrorMessage text={getError(emailField)} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
