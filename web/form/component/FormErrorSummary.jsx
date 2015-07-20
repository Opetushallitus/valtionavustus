import React from 'react'
import _ from 'lodash'

import JsUtil from './../JsUtil.js'
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

  shouldComponentUpdate(nextProps, nextState) {
    const oldIdsOfInvalidFields = _.keys(this.props.validationErrors);
    const newIdsOfInvalidFields = _.keys(nextProps.validationErrors);
    const oldValidationErrors = this.props.validationErrors
    const isUptoDate = this.state.open === nextState.open &&
                        this.props.lang === nextProps.lang &&
                        oldIdsOfInvalidFields.length === newIdsOfInvalidFields.length &&
                        _.reduce(oldIdsOfInvalidFields, function(acc, id) {
                          return acc && _.isEqual(oldValidationErrors[id], nextProps.validationErrors[id])
                        }, true)
    return !isUptoDate
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
    const fieldsWithErrorsAndClosestParents = FormErrorSummary.resolveFieldsErrorsAndClosestParents(validationErrors, formContent)
    const invalidFieldsCount = fieldsWithErrorsAndClosestParents.length
    const fieldErrorMessageElements = _.map(fieldsWithErrorsAndClosestParents, x => {
      return this.renderFieldErrors(formContent, x.field, x.closestParent, x.errors, lang)
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

  static resolveFieldsErrorsAndClosestParents(validationErrors, formContent) {
    function gatherParentAndErrorsFromChildren(parentField) {
      _.forEach(parentField.children, childField => {
        const errorsOfField = validationErrors[childField.id]
        if (errorsOfField && errorsOfField.length > 0) {
          results.push({
            field: childField,
            errors: validationErrors[childField.id],
            closestParent: parentField
          })
        }
      })
    }

    var results = []
    JsUtil.traverseMatching(formContent, x => { return x && !_.isUndefined(x.id) }, gatherParentAndErrorsFromChildren)
    return _.sortBy(results, x => {return FormUtil.findFieldIndex(formContent, x.field.id)})
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
