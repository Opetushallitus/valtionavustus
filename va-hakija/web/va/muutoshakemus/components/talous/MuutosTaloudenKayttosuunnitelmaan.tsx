import React from 'react'

import {useTranslations} from '../../TranslationContext'
import { FormikHook, Talousarvio } from '../../../../../../va-common/web/va/types/muutoshakemus'

type MuutosTaloudenKayttosuunnitelmaanProps = {
  f: FormikHook
  talousarvio: Talousarvio
}

export const MuutosTaloudenKayttosuunnitelmaan = ({ f, talousarvio }: MuutosTaloudenKayttosuunnitelmaanProps) => {
  const { t } = useTranslations()
  return (
    <>
        <div className="muutoshakemus__section-checkbox-row">
          <input
            name="haenMuutostaTaloudenKayttosuunnitelmaan"
            type="checkbox"
            id="checkbox-talous"
            onChange={f.handleChange}
            onBlur={f.handleBlur}
            checked={f.values.haenMuutostaTaloudenKayttosuunnitelmaan}
          />
          <label htmlFor="checkbox-jatkoaika">
            {t.muutosTaloudenKayttosuunnitelmaan.checkboxTitle}
          </label>
        </div>
        {f.values.haenMuutostaTaloudenKayttosuunnitelmaan && <p>{JSON.stringify(talousarvio, undefined, 2)}</p>}
    </>
  )
}
