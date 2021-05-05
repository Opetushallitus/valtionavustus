import React from 'react'
import { DateTimePicker } from 'react-widgets'
import moment from 'moment'

import { FormikHook } from 'va-common/web/va/types/muutoshakemus'
import { getInputErrorClass } from 'va-common/web/va/formikHelpers'

import { useTranslations } from '../../../../../../va-common/web/va/i18n/TranslationContext'
import { ErrorMessage } from '../../ErrorMessage'
import { PerustelutTextArea } from '../PerustelutTextArea'

import 'react-widgets/dist/css/react-widgets.css'
import './jatkoaika.less'

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
          <div className="h3">{t.kayttoajanPidennys.existingExpirationDateTitle}</div>
          <div className="muutoshakemus__current-project-end">{projectEnd}</div>
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
      <PerustelutTextArea f={f} name='kayttoajanPidennysPerustelut' />
    </>
  )
}
