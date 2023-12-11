import React from 'react'
import _ from 'lodash'
import Translator from '../Translator'
import { Language, LegacyTranslationDict } from 'soresu-form/web/va/types'

interface HelpTooltipProps {
  content: LegacyTranslationDict
  lang: Language
  useJotpaColour?: boolean
}

export default function HelpTooltip({ content, lang, useJotpaColour }: HelpTooltipProps) {
  const translator = new Translator({ content })
  const helpText = content[lang]
  if (!helpText || '' === helpText) {
    return <span />
  }
  const value = translator.translate('content', lang)
  return (
    <a
      className={
        'soresu-tooltip soresu-tooltip-up ' +
        (useJotpaColour ? 'jotpa-help-icon' : 'soresu-help-icon')
      }
    >
      <span>{value}</span>
    </a>
  )
}
