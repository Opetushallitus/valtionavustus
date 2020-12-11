import React from 'react'

import { AvustuksenKayttoaikaInput } from './AvustuksenKayttoaikaInput'
import {useTranslations} from '../../TranslationContext'
import { FormikHook } from '../../types'

import './jatkoaika.less'

type AvustuksenKayttoajanPidennysProps = {
  f: FormikHook
  projectEnd: string
}

export const AvustuksenKayttoajanPidennys = ({ f, projectEnd }: AvustuksenKayttoajanPidennysProps) => {
  const { t } = useTranslations()
  return (
    <section className="muutoshakemus__section" id="section-muutosten-hakeminen-checkbox">
      <h1 className="muutoshakemus__title">{t.applicationEdit.title}</h1>
      <div className="muutoshakemus__form">
        <div className="muutoshakemus__section-checkbox-row">
          <input
            name="haenKayttoajanPidennysta"
            type="checkbox"
            id="checkbox-jatkoaika"
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            checked={f.values.haenKayttoajanPidennysta}
          />
          <label htmlFor="checkbox-jatkoaika">
            {t.kayttoajanPidennys.checkboxTitle}
          </label>
        </div>
        {f.values.haenKayttoajanPidennysta && <AvustuksenKayttoaikaInput f={f} projectEnd={projectEnd} />}
      </div>
    </section>
  )
}
