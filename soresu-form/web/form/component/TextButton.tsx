import React from 'react'

import LocalizedString from './LocalizedString'
import { Language, LegacyTranslationDict } from 'soresu-form/web/va/types'

interface Props {
  htmlId: string
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
  disabled: boolean
  translations: LegacyTranslationDict
  translationKey: string
  lang: Language
  useJotpaColour?: boolean
}

/**
 * Button that is not bound to any form field.
 */
const TextButton = (props: Props) => {
  return (
    <button
      id={props.htmlId}
      className="soresu-text-button"
      type="button"
      onClick={props.onClick}
      disabled={props.disabled}
    >
      <LocalizedString
        translations={props.translations}
        translationKey={props.translationKey}
        lang={props.lang}
      />
    </button>
  )
}

export default TextButton
