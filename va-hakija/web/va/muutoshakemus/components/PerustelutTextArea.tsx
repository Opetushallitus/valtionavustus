import React from 'react'

import { useTranslations } from '../TranslationContext'
import { ErrorMessage } from '../ErrorMessage'
import { getInputErrorClass } from '../formikHelpers'
import { FormikHook, FormValues } from '../../../../../va-common/web/va/types/muutoshakemus'

type PerustelutTextAreaProps = {
  f: FormikHook
  name: keyof FormValues
}

export const PerustelutTextArea = ({ f, name }: PerustelutTextAreaProps) => {
  const { t } = useTranslations()
  const reasonError = getInputErrorClass(f, name)
  const id = `perustelut-${name}`

  return (
    <div className="muutoshakemus__perustelut">
      <label htmlFor={id}>{t.muutosTaloudenKayttosuunnitelmaan.reasoning}</label>
      <textarea
        id={id}
        name={name}
        className={reasonError}
        rows={5}
        cols={53}
        onChange={f.handleChange}
        onBlur={f.handleBlur}
        value={f.values[name] as string}
      />
      <ErrorMessage text={f.errors[name] as string} />
    </div>
  )
}
