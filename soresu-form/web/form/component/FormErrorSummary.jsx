import React, { useState } from 'react'
import _ from 'lodash'

import JsUtil from '../../JsUtil'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString.tsx'
import Translator from '../Translator'

function determineCssClass(isOpen) {
  return isOpen ? 'open' : 'closed'
}

function resolveFieldsErrorsAndClosestParents(validationErrors, formContent) {
  function gatherParentAndErrorsFromChildren(parentField) {
    _.forEach(parentField.children, (childField) => {
      const errorsOfField = validationErrors[childField.id]
      if (errorsOfField && errorsOfField.length > 0) {
        results.push({
          field: childField,
          errors: validationErrors[childField.id],
          closestParent: parentField,
        })
      }
    })
  }

  const results = []
  JsUtil.traverseMatching(
    formContent,
    (x) => {
      return x && !_.isUndefined(x.id)
    },
    gatherParentAndErrorsFromChildren
  )
  return _.sortBy(results, (x) => FormUtil.findIndexOfField(formContent, x.field.id))
}

export default function FormErrorSummary(props) {
  const { translations, controller, lang, formContent, validationErrors } = props
  const [open, setOpen] = useState(false)

  const toggleOpen = () => {
    setOpen(!open)
  }

  const jumpToField = (id) => {
    return function (event) {
      let field = document.getElementById(id)
      if (!field) {
        const elementsByName = document.getElementsByName(id)
        if (elementsByName.length > 0) {
          field = elementsByName[0]
        }
      }
      if (field) {
        const scrollToElement = field.previousElementSibling || field
        FormUtil.scrollTo(scrollToElement, 700, function () {
          field.focus()
        })
      } else {
        console.error('Can not scroll to field, because not found ' + id)
      }
      event.preventDefault()
    }
  }

  const renderFieldErrors = (formContent, field, closestParent, errors, lang) => {
    const fieldErrors = []
    const labelHolder = field.label ? field : closestParent
    const htmlId = controller.constructHtmlId(formContent, field.id)
    for (let i = 0; i < errors.length; i++) {
      const error = errors[i]
      const key = htmlId + '-validation-error-' + error.error
      if (fieldErrors.length > 0) {
        fieldErrors.push(<span key={key + '-separator'}>, </span>)
      }
      fieldErrors.push(
        <LocalizedString
          key={key}
          translations={translations}
          translationKey={error.error}
          lang={lang}
        />
      )
    }
    return (
      <div className="error" key={htmlId + '-validation-error'} data-test-id={htmlId}>
        <a role="button" onClick={jumpToField(htmlId)}>
          <LocalizedString
            translations={labelHolder}
            translationKey="label"
            defaultValue={field.id}
            lang={lang}
          />
        </a>
        <span>: </span>
        {fieldErrors}
      </div>
    )
  }

  const translator = new Translator(translations)
  const fieldsWithErrorsAndClosestParents = resolveFieldsErrorsAndClosestParents(
    validationErrors,
    formContent
  )
  const invalidFieldsCount = fieldsWithErrorsAndClosestParents.length

  if (invalidFieldsCount === 0) {
    return null
  }

  const fieldErrorMessageElements = _.map(fieldsWithErrorsAndClosestParents, (x) => {
    return renderFieldErrors(formContent, x.field, x.closestParent, x.errors, lang)
  })

  const openStateClassName = determineCssClass(open)

  return (
    <div id="form-error-summary">
      <a
        onClick={toggleOpen}
        role="button"
        className={'error soresu-opener-handle validation-errors-summary ' + openStateClassName}
      >
        {translator.translate('validation-errors', lang, null, {
          kpl: invalidFieldsCount,
        })}
      </a>
      <div className="popup validation-errors" hidden={!open}>
        {fieldErrorMessageElements}
      </div>
    </div>
  )
}
