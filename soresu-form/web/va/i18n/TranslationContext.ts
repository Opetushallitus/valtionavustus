import React, { useContext } from 'react'
import { Language, Translations, translations } from './translations'

export interface TranslationContext {
  t: Translations
  lang: Language
}

const defaultTranslations = {
  t: translations.fi,
  lang: 'fi' as Language,
}

export const TranslationContext = React.createContext<TranslationContext>(defaultTranslations)

export const useTranslations = () => {
  const context = useContext(TranslationContext)
  if (!context && context !== null) {
    throw new Error('Translations not available')
  }
  return context
}

export function getTranslationContext(lang: Language): TranslationContext {
  return { t: translations[lang], lang }
}
