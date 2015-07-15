import React from 'react'
import LocalizedString from './LocalizedString.jsx'
import Translator from './../Translator.js'

export default class FormErrorSummary extends React.Component {

  constructor(props) {
    super(props)
    this.translations = this.props.translations
  }

  getField(field, id) {
    if(field && field.id === id) {
      return field
    }
    if(field.children) {
      return this.findField(field.children, id)
    }
    return undefined
  }

  findField(fields, id) {
    for (var i=0; i < fields.length; i++) {
      const field = this.getField(fields[i], id)
      if(field) {
        return field
      }
    }
    return undefined
  }

  renderFieldErrors(field, errors, lang) {
    if(field && field.label) {
      const fieldErrors = []
      for (var i=0; i < errors.length; i++) {
        const error = errors[i]
        const key = field.id + "-validation-error-" + error.error
        if(fieldErrors.length > 0){
          fieldErrors.push(<span key={key + "-separator"}>, </span>)
        }
        fieldErrors.push( <LocalizedString key={key} translations={this.translations} translationKey={error.error} lang={lang} />)
      }
      return <div className="error" key={field.id + "-validation-error"}>
              <LocalizedString translations={field} translationKey="label" lang={lang} /><span>: </span>
              {fieldErrors}
            </div>
    }
    return undefined
  }

  render() {
    const lang = this.props.lang
    const fields = this.props.fields
    const validationErrors = this.props.validationErrors
    const translator = new Translator(this.translations)
    const saveError = this.props.saveError.length > 0 ? translator.translate(this.props.saveError, lang) : ""
    const children = []
    var invalidFieldsCount = 0
    if (validationErrors instanceof Object) {
      for (var fieldId in validationErrors) {
        const errors = validationErrors[fieldId]
        if(errors.length > 0) {
          invalidFieldsCount++
          const fieldErrors = this.renderFieldErrors(this.findField(fields, fieldId), errors, lang)
          if(fieldErrors) {
            children.push(fieldErrors)
          }
        }
      }
    }
    return (
      <div id="form-error-summary" hidden={invalidFieldsCount === 0 && saveError.length === 0}>
        <div hidden={saveError.length === 0} className="error">{saveError}</div>
        <div className="error" id="validation-errors-summary" hidden={invalidFieldsCount === 0}>
          <LocalizedString hidden={invalidFieldsCount === 0} translations={this.translations} translationKey="validation-errors" lang={lang} keyValues={{kpl: invalidFieldsCount}} />
        </div>
        <div id="validation-errors" hidden="true">
          {children}
        </div>
      </div>
    )
  }
}
