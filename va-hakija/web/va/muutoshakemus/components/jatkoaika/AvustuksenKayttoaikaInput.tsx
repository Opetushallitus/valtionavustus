import React from 'react'
import { DateTimePicker } from 'react-widgets'

import { useTranslations } from '../../TranslationContext'
import { FormikHook } from '../../types'

import 'react-widgets/dist/css/react-widgets.css'

type AvustuksenKayttoaikaInputProps = {
  f: FormikHook
  projectEnd: string
}

export const AvustuksenKayttoaikaInput = ({ f, projectEnd }: AvustuksenKayttoaikaInputProps) => {
  const { t } = useTranslations()

  return (
    <div>
      <div className="input twocolumns">
        <div>
          <div className="h3">{t.kayttoajanPidennys.existingExpirationDateTitle}</div>
          <div className="paattymispaiva">{projectEnd}</div>
        </div>
        <div>
          <div className='h3'>
            {t.kayttoajanPidennys.newExpirationDateTitle}
          </div>
          <div className="paattymispaiva">
            <DateTimePicker
              name="haettuKayttoajanPaattymispaiva"
              onChange={(newDate?: Date) => { f.setFieldValue('haettuKayttoajanPaattymispaiva', newDate) }}
              containerClassName={f.errors.haettuKayttoajanPaattymispaiva ? 'datepicker dp-error' : 'datepicker'}
              defaultValue={new Date()}
              time={false} />
          </div>
        </div>
      </div>
      <div className="textareacontainer">
        <label htmlFor="perustelut-jatkoaika">{t.kayttoajanPidennys.reasonsTitle}</label>
        <textarea
          id="perustelut-jatkoaika"
          name="kayttoajanPidennysPerustelut"
          className={f.errors.kayttoajanPidennysPerustelut ? 'error' : ''}
          rows={5}
          onChange={f.handleChange}
          onBlur={f.handleBlur}
          value={f.values.kayttoajanPidennysPerustelut}
        />
      </div>
    </div>
  )
}
