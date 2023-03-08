import React from 'react'
import Translator from './../Translator'
import { Language, LegacyTranslationDict } from 'soresu-form/web/va/types'

interface Props {
  lang: Language
  translations: LegacyTranslationDict
  translationKey: string
  defaultValue?: string
  keyValues?: Record<string, string>
  htmlId?: string
  hidden?: boolean
  className?: string
  onClick?: (event: React.MouseEvent<HTMLSpanElement>) => void
}

const LocalizedString = ({
  translations,
  translationKey,
  lang,
  defaultValue,
  keyValues,
  htmlId,
  hidden,
  className,
  onClick,
}: Props) => {
  const translator = new Translator(translations)
  const value = translator.translate(translationKey, lang, defaultValue, keyValues)
  return (
    <span id={htmlId} hidden={hidden} className={className} onClick={onClick}>
      {value}
    </span>
  )
}

export default LocalizedString
