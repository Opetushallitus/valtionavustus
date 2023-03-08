import React from 'react'

import { FormikHook, FormValues } from 'soresu-form/web/va/types/muutoshakemus'
import { getInputErrorClass } from 'soresu-form/web/va/formikHelpers'

import { useTranslations } from 'soresu-form/web/va/i18n/TranslationContext'
import { ErrorMessage } from '../ErrorMessage'

type PerustelutTextAreaProps = {
  f: FormikHook
  name: keyof FormValues
  title?: string
}

export const PerustelutTextArea = ({ f, name, title }: PerustelutTextAreaProps) => {
  const { t } = useTranslations()
  const reasonError = getInputErrorClass(f, name)
  const id = `perustelut-${name}`

  return (
    <div className="muutoshakemus__perustelut">
      <label htmlFor={id}>{title || t.applicationEdit.reasoning}</label>
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
