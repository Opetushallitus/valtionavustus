import React from 'react'
import LocalizedString from './LocalizedString.jsx'
import Translator from './../Translator.js'

export default class FormErrorSummary extends React.Component {
  render() {
    const lang = this.props.lang
    const translations = this.props.translations
    const validationErrors = this.props.validationErrors
    const translator = new Translator(translations)
    const submitError = this.props.submitError.length > 0 ? translator.translate(this.props.submitError, lang) : ""
    const children = []
    var invalidFieldsCount = 0
    if (validationErrors instanceof Object) {
      for (var fieldId in validationErrors) {
        const error = validationErrors[fieldId]
        if(error.length > 0) {
          children.push(<div>{fieldId + ": " + JSON.stringify(error)}</div>)
          invalidFieldsCount++
        }
      }
    }
    return (
      <div id="form-error-summary" hidden={invalidFieldsCount === 0 && submitError.length === 0}>
        <div hidden={submitError.length === 0} className="error">{submitError}</div>
        <div className="error" id="validation-errors" hidden={invalidFieldsCount === 0}>
          <LocalizedString hidden={invalidFieldsCount === 0} translations={translations} translationKey="validation-errors" lang={lang} keyValues={{kpl: invalidFieldsCount}} />
          <div hidden="true">
            {children}
          </div>
        </div>
      </div>
    )
  }
}
