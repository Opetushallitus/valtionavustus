export default class Translator {
  constructor(translations) {
    this.translations = translations;
  }

  getValue(key, lang, defaultValue) {
    const values = this.translations[key]
    if (values instanceof Object) {
      var value = values[lang]
      if (value) {
        return value
      }
      console.error("No translations found for '" + key + "' in lang '" + lang + "' from:" + JSON.stringify(values))
      for (var key in values) {
        if (values[key]) {
          return values[key]
        }
      }
    }
    console.error("No translations found for '" + key + "' from:" + JSON.stringify(this.translations))
    return defaultValue ? defaultValue : key
  }

  replaceKeys(value, keyValues) {
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
    return this.replaceKeys(value, keyValues)
  }
}

