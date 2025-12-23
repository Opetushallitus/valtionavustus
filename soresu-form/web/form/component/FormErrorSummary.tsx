import React, { useState } from 'react'

import JsUtil from '../../JsUtil'
import FormUtil from '../FormUtil'
import LocalizedString from './LocalizedString'
import Translator from '../Translator'
import FormController from 'soresu-form/web/form/FormController'
import { Field, Language, LegacyTranslationDict } from 'soresu-form/web/va/types'

interface ValidationError {
  error: string
}

interface ValidationErrors {
  [fieldId: string]: ValidationError[]
}

interface FieldWithErrorsAndParent {
  field: Field
  errors: ValidationError[]
  closestParent: Field
}

interface FormErrorSummaryProps {
  translations: LegacyTranslationDict
  controller: FormController<any>
  lang: Language
  formContent: Field[]
  validationErrors: ValidationErrors
}

function resolveFieldsErrorsAndClosestParents(
  validationErrors: ValidationErrors,
  formContent: Field[]
): FieldWithErrorsAndParent[] {
  function gatherParentAndErrorsFromChildren(parentField: Field) {
    if (!parentField.children) {
      return
    }
    for (const childField of parentField.children) {
      const errorsOfField = validationErrors[childField.id]
      if (!errorsOfField || errorsOfField.length < 1) {
        continue
      }
      results.push({
        field: childField,
        errors: validationErrors[childField.id],
        closestParent: parentField,
      })
    }
  }

  const results: FieldWithErrorsAndParent[] = []
  JsUtil.traverseMatching(
    formContent,
    (x: any) => {
      return x && x.id !== undefined
    },
    gatherParentAndErrorsFromChildren
  )
  return results.sort((a, b) => {
    const indexA = FormUtil.findIndexOfField(formContent, a.field.id)
    const indexB = FormUtil.findIndexOfField(formContent, b.field.id)
    return indexA - indexB
  })
}

export default function FormErrorSummary(props: FormErrorSummaryProps) {
  const { translations, controller, lang, formContent, validationErrors } = props
  const [open, setOpen] = useState<boolean>(false)

  const jumpToField = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault()

    let field = document.getElementById(id) as HTMLElement | null
    if (!field) {
      const elementsByName = document.getElementsByName(id)
      if (elementsByName.length > 0) {
        field = elementsByName[0]
      }
    }

    if (!field) {
      return
    }
    const scrollToElement = (field.previousElementSibling as HTMLElement) || field
    FormUtil.scrollTo(scrollToElement, 700, () => {
      field.focus()
    })
  }

  const renderFieldError = (field: Field, closestParent: Field, errors: ValidationError[]) => {
    const labelHolder = field.label ? field : closestParent
    const htmlId = controller.constructHtmlId(formContent, field.id)

    const fieldErrors: React.ReactElement[] = []
    for (const error of errors) {
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
            translations={labelHolder as any}
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

  return (
    <div id="form-error-summary">
      <a
        onClick={() => setOpen(!open)}
        role="button"
        className={`error soresu-opener-handle validation-errors-summary ${open ? 'open' : 'closed'}`}
      >
        {translator.translate('validation-errors', lang, undefined, {
          kpl: String(invalidFieldsCount),
        })}
      </a>
      <div className="popup validation-errors" hidden={!open}>
        {fieldsWithErrorsAndClosestParents.map((x) =>
          renderFieldError(x.field, x.closestParent, x.errors)
        )}
      </div>
    </div>
  )
}
