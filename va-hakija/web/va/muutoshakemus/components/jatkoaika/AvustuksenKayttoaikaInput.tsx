import React from 'react'
import DatePicker from 'react-widgets/DatePicker'
import moment from 'moment'
import { FormikHook } from 'soresu-form/web/va/types/muutoshakemus'
import { getInputErrorClass } from 'soresu-form/web/va/formikHelpers'
import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'
import { parseDateString } from 'soresu-form/web/va/i18n/dateformat'
import { ErrorMessage } from '../../ErrorMessage'
import { PerustelutTextArea } from '../PerustelutTextArea'

import 'react-widgets/styles.css'
import './jatkoaika.css'

type AvustuksenKayttoaikaInputProps = {
  f: FormikHook
  projectEnd: string | undefined
}

export const AvustuksenKayttoaikaInput = ({ f, projectEnd }: AvustuksenKayttoaikaInputProps) => {
  const { t } = useTranslations()
  const datepickerError = getInputErrorClass(f, 'haettuKayttoajanPaattymispaiva')

  return (
    <>
      <div className="twocolumns">
        <div>
          <div className="h3" data-test-id="jatkoaika-title-existing">
            {t.kayttoajanPidennys.existingExpirationDateTitle}
          </div>
          <div className="muutoshakemus__current-project-end">{projectEnd}</div>
        </div>
        <div>
          <div className="h3" data-test-id="jatkoaika-title-new">
            {t.kayttoajanPidennys.newExpirationDateTitle}
          </div>
          <div>
            <DatePicker
              name="haettuKayttoajanPaattymispaiva"
              onChange={(newDate: Date | null | undefined) => {
                const d = moment(newDate)
                if (d.isValid()) {
                  f.setFieldValue('haettuKayttoajanPaattymispaiva', newDate)
                } else {
                  f.setFieldValue('haettuKayttoajanPaattymispaiva', undefined)
                }
              }}
              parse={parseDateString}
              containerClassName={`datepicker ${datepickerError}`}
              defaultValue={f.initialValues.haettuKayttoajanPaattymispaiva}
            />
            <ErrorMessage text={f.errors.haettuKayttoajanPaattymispaiva} />
          </div>
        </div>
      </div>
      <PerustelutTextArea f={f} name="kayttoajanPidennysPerustelut" />
    </>
  )
}
