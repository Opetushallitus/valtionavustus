import React from 'react'
import { DateTimePicker } from 'react-widgets'
import moment from 'moment'

import { useTranslations } from '../../TranslationContext'
import { ErrorMessage } from '../../ErrorMessage'
import { getInputErrorClass } from '../../formikHelpers'
import { FormikHook } from '../../../../../../va-common/web/va/types/muutoshakemus'

import 'react-widgets/dist/css/react-widgets.css'

type AvustuksenKayttoaikaInputProps = {
  f: FormikHook
  projectEnd: string | undefined
}

export const AvustuksenKayttoaikaInput = ({ f, projectEnd }: AvustuksenKayttoaikaInputProps) => {
  const { t } = useTranslations()
  const datepickerError = getInputErrorClass(f, 'haettuKayttoajanPaattymispaiva')
  const reasonError = getInputErrorClass(f, 'kayttoajanPidennysPerustelut')

  return (
    <div className="muutoshakemus__checked-form">
      <div className="twocolumns">
        <div>
          <div className="h3">{t.kayttoajanPidennys.existingExpirationDateTitle}</div>
          <div className="muutoshakemus__current-project-end"><span>{projectEnd}</span></div>
        </div>
        <div>
          <div className='h3'>
            {t.kayttoajanPidennys.newExpirationDateTitle}
          </div>
          <div>
            <DateTimePicker
              name="haettuKayttoajanPaattymispaiva"
              onChange={(newDate?: Date) => {
                const d = moment(newDate)
                if (d.isValid()) {
                  f.setFieldValue('haettuKayttoajanPaattymispaiva', newDate)
                } else {
                  f.setFieldValue('haettuKayttoajanPaattymispaiva', undefined)
                }
              }}
              containerClassName={`datepicker ${datepickerError}`}
              defaultValue={f.initialValues.haettuKayttoajanPaattymispaiva}
              time={false} />
            <ErrorMessage text={f.errors.haettuKayttoajanPaattymispaiva} />
          </div>
        </div>
      </div>
      <div className="textareacontainer">
        <label htmlFor="perustelut-jatkoaika">{t.kayttoajanPidennys.reasonsTitle}</label>
        <textarea
          id="perustelut-jatkoaika"
          name="kayttoajanPidennysPerustelut"
          className={reasonError}
          rows={5}
          cols={53}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          value={f.values.kayttoajanPidennysPerustelut}
        />
        <ErrorMessage text={f.errors.kayttoajanPidennysPerustelut} />
      </div>
    </div>
  )
}
