import React from 'react'
import _ from 'lodash'

import JsUtil from '../../JsUtil'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString.jsx'
import Translator from '../Translator'

export default class FormErrorSummary extends React.Component {

  constructor(props) {
    super(props)
    this.translations = this.props.translations
    this.controller = this.props.controller
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

  static determineCssClass(isOpen) {
    return isOpen ? "open" : "closed"
  }

  render() {
    const lang = this.props.lang
    const formContent = this.props.formContent
    const validationErrors = this.props.validationErrors
    const translator = new Translator(this.translations)
    const fieldsWithErrorsAndClosestParents = FormErrorSummary.resolveFieldsErrorsAndClosestParents(validationErrors, formContent)
    const invalidFieldsCount = fieldsWithErrorsAndClosestParents.length

    if (invalidFieldsCount === 0) {
      return null
    }

    const fieldErrorMessageElements = _.map(fieldsWithErrorsAndClosestParents, x => {
      return this.renderFieldErrors(formContent, x.field, x.closestParent, x.errors, lang)
    })

    const openStateClassName = FormErrorSummary.determineCssClass(this.state.open)

    return (
      <div id="form-error-summary">
        <a onClick={this.toggleOpen} role="button" className={"error soresu-opener-handle validation-errors-summary " + openStateClassName}>
          {translator.translate("validation-errors", lang, null, {kpl: invalidFieldsCount})}
        </a>
        <div className="popup validation-errors" hidden={!this.state.open}>
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
    const htmlId = this.controller.constructHtmlId(formContent, field.id)
    for (var i = 0; i < errors.length; i++) {
      const error = errors[i]
      const key = htmlId+ "-validation-error-" + error.error
      if (fieldErrors.length > 0) {
        fieldErrors.push(<span key={key + "-separator"}>, </span>)
      }
      fieldErrors.push(<LocalizedString key={key} translations={this.translations} translationKey={error.error}
                                        lang={lang}/>)
    }
    return <div className="error" key={htmlId + "-validation-error"} data-field-id={htmlId}>
      <a role="button" onClick={this.jumpToField(htmlId)}><LocalizedString translations={labelHolder} translationKey="label" defaultValue={field.id} lang={lang} /></a><span>: </span>
      {fieldErrors}
    </div>
  }

  jumpToField(id) {
    return function(event) {
      var field = document.getElementById(id)
      if(!field) {
        const elementsByName = document.getElementsByName(id)
        if(elementsByName.length > 0) {
          field = elementsByName[0]
        }
      }
      if(field) {
        const scrollToElement = field.previousElementSibling || field
        FormUtil.scrollTo(scrollToElement, 700, function () {field.focus()})
      }
      else {
        console.error("Can not scroll to field, because not found " + id)
      }
      event.preventDefault()
    }
  }
}
