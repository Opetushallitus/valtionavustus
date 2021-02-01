import React from 'react'
import { FormikHook, Language } from 'va-common/web/va/standardized-form-fields/types'

interface StandardizedFormFieldsProps {
  f: FormikHook
  environment: any
  lang: Language
}

function validateLanguage(s: unknown): Language {
  if (s !== 'fi' && s !== 'sv') {
    throw new Error(`Unrecognized language: ${s}`)
  }
  return s
}

export const StandardizedFormFields = ({f, environment, lang}: StandardizedFormFieldsProps) => {
  const validatedLang = validateLanguage(lang) || 'fi'
  const muutospaatosprosessiEnabled =
    (environment["muutospaatosprosessi"] &&
      environment["muutospaatosprosessi"]["enabled?"]) || false
  return (
    muutospaatosprosessiEnabled
    ? <p className="soresu-info-element">{f.values["help-text-" + validatedLang]}</p>
    : <span/>
  )
}
