import React from 'react'
import _ from 'lodash'

import FormUtil from './../FormUtil.js'
import LocalizedString from './LocalizedString.jsx'
import Translator from './../Translator.js'

export default class FormErrorSummary extends React.Component {

  constructor(props) {
    super(props)
    this.translations = this.props.translations
    this.model = this.props.model
    this.toggleOpen = this.toggleOpen.bind(this)
    this.state = { open: false }
  }

  toggleOpen() {
    this.setState({
      open: !this.state.open
    })
  }

  render() {
    const lang = this.props.lang
    const formContent = this.props.formContent
    const validationErrors = this.props.validationErrors
    const translator = new Translator(this.translations)
    const saveError = this.props.saveError.length > 0 ? translator.translate(this.props.saveError, lang) : ""
    const idsOfInvalidFields = _.keys(validationErrors);
    const idsWithErrors = _(idsOfInvalidFields).
                            map(id => { return { fieldId: id, errors: validationErrors[id] } }).
                            filter(idWithErrors => { return idWithErrors.errors.length !== 0} ).
                            value()
    const invalidFieldsCount = idsWithErrors.length
    const fieldErrorMessageElements = _.map(idsWithErrors, idWithErrors => {
      const closestParent = FormUtil.findFieldWithDirectChild(formContent, idWithErrors.fieldId)
      return this.renderFieldErrors(formContent, FormUtil.findField(formContent, idWithErrors.fieldId), closestParent, idWithErrors.errors, lang)
    })
    return (
      <div id="form-error-summary" hidden={invalidFieldsCount === 0 && saveError.length === 0}>
        <div hidden={saveError.length === 0} className="error">{saveError}</div>
        <a onClick={this.toggleOpen} role="button" className="error" id="validation-errors-summary" hidden={invalidFieldsCount === 0}>
          {translator.translate("validation-errors", lang, null, {kpl: invalidFieldsCount})}
        </a>
        <div className="popup" hidden={!this.state.open || invalidFieldsCount === 0} id="validation-errors">
          <a role="button" className="popup-close" onClick={this.toggleOpen}>&times;</a>
          {fieldErrorMessageElements}
        </div>
      </div>
    )
  }

  renderFieldErrors(formContent, field, closestParent, errors, lang) {
    const fieldErrors = []
    const labelHolder = field.label ? field : closestParent
    const htmlId = this.model.constructHtmlId(formContent, field.id)
    for (var i = 0; i < errors.length; i++) {
      const error = errors[i]
      const key = htmlId+ "-validation-error-" + error.error
      if (fieldErrors.length > 0) {
        fieldErrors.push(<span key={key + "-separator"}>, </span>)
      }
      fieldErrors.push(<LocalizedString key={key} translations={this.translations} translationKey={error.error}
                                        lang={lang}/>)
    }
    return <div className="error" key={htmlId + "-validation-error"}>
      <a role="button" onClick={this.jumpToField(htmlId)}><LocalizedString translations={labelHolder} translationKey="label" defaultValue={field.id} lang={lang} /></a><span>: </span>
      {fieldErrors}
    </div>
  }

  jumpToField(id) {
    return function(event) {
      const field = document.getElementById(id)
      FormUtil.scrollTo(field, 700, function(){field.focus()})
      event.preventDefault()
    }
  }
}
