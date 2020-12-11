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
    <section className="section" id="section-muutosten-hakeminen-checkbox">
      <h2>{t.applicationEdit.title}</h2>
      <div className="content muutoksenhaku">
        <div className="kayttoajan-pidennys">

          <div className="checkbox-jatkoaika-container">
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
      </div>
    </section>
  )
}
