export default class Translator {
  constructor(translations) {
    this.translations = translations;
  }

  translate(key, lang, defaultValue) {
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
}

