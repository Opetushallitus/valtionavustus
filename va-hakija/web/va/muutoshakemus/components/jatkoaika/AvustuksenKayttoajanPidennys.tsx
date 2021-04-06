import React from 'react'

import { AvustuksenKayttoaikaInput } from './AvustuksenKayttoaikaInput'
import {useTranslations} from '../../TranslationContext'
import { FormikHook } from '../../../../../../va-common/web/va/types/muutoshakemus'

import './jatkoaika.less'

type AvustuksenKayttoajanPidennysProps = {
  f: FormikHook
  projectEnd: string | undefined
}

export const AvustuksenKayttoajanPidennys = ({ f, projectEnd }: AvustuksenKayttoajanPidennysProps) => {
  const { t } = useTranslations()
  return (
    <>
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
    </>
  )
}
