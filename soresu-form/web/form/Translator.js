export default class Translator {
  constructor(translations) {
    this.translations = translations
  }

  getValue(key, lang, defaultValue) {
    const values = this.translations[key]

    if (values instanceof Object) {
      const value = values[lang]

      if (typeof value !== 'undefined') {
        return value
      }

      for (const altkey in values) {
        const altvalue = values[altkey]

        if (typeof altvalue !== 'undefined') {
          console.error(`No translations found for "${key}" (used fallback "${altkey}") in lang "${lang}" from:\n` + JSON.stringify(values))

          return altvalue
        }
      }
    }

    console.error(`No translations found for "${key}" in lang "${lang}" from:\n` + JSON.stringify(this.translations))

    return defaultValue ? defaultValue : key
  }

  static replaceKeys(value, keyValues) {
    const NON_BREAKING_SPACE = "\u00A0"
    if(keyValues instanceof Object) {
      for (var key in keyValues) {
        const keyValue = keyValues[key] ? keyValues[key] : NON_BREAKING_SPACE
        value = value.replace("{{" + key + "}}", keyValue)
      }
    }
    return value
  }

  translate(key, lang, defaultValue, keyValues) {
    const value = this.getValue(key, lang, defaultValue)
    return Translator.replaceKeys(value, keyValues)
  }
}

