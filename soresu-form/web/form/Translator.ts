import { languages, Language, LegacyTranslationDict } from '../va/types'

export default class Translator {
  translations: LegacyTranslationDict

  constructor(translations: LegacyTranslationDict) {
    this.translations = translations
  }

  getValue(key: string, lang: Language, defaultValue?: string) {
    const values = this.translations[key]

    if (values instanceof Object) {
      const value = values[lang]

      if (typeof value !== 'undefined') {
        return value
      }

      for (const altkey in languages) {
        const altvalue = values[altkey as Language]

        if (typeof altvalue !== 'undefined') {
          console.error(
            `No translations found for "${key}" (used fallback "${altkey}") in lang "${lang}" from:\n` +
              JSON.stringify(values)
          )

          return altvalue
        }
      }
    }

    console.error(
      `No translations found for "${key}" in lang "${lang}" from:\n` +
        JSON.stringify(this.translations)
    )

    return defaultValue ? defaultValue : key
  }

  static replaceKeys(value: string, keyValues?: Record<string, string>) {
    const NON_BREAKING_SPACE = '\u00A0'
    if (keyValues instanceof Object) {
      for (const key in keyValues) {
        const keyValue = keyValues[key] ? keyValues[key] : NON_BREAKING_SPACE
        value = value.replace('{{' + key + '}}', keyValue)
      }
    }
    return value
  }

  translate(
    key: string,
    lang: Language,
    defaultValue?: string,
    keyValues?: Record<string, string>
  ) {
    const value = this.getValue(key, lang, defaultValue)
    return typeof value === 'string' ? Translator.replaceKeys(value, keyValues) : ''
  }

  static translateKey(
    translations: LegacyTranslationDict,
    key: string,
    lang: Language,
    keyValues?: Record<string, string>,
    defaultValue?: string
  ) {
    const translator = new Translator(translations)
    return translator.translate(key, lang, defaultValue, keyValues)
  }
}
