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

function determineCssClass(isOpen: boolean): string {
  return isOpen ? 'open' : 'closed'
}

function resolveFieldsErrorsAndClosestParents(
  validationErrors: ValidationErrors,
  formContent: Field[]
): FieldWithErrorsAndParent[] {
  function gatherParentAndErrorsFromChildren(parentField: Field) {
    if (parentField.children) {
      for (const childField of parentField.children) {
        const errorsOfField = validationErrors[childField.id]
        if (errorsOfField && errorsOfField.length > 0) {
          results.push({
            field: childField,
            errors: validationErrors[childField.id],
            closestParent: parentField,
          })
        }
      }
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

  const toggleOpen = () => {
    setOpen(!open)
  }

  const jumpToField = (id: string) => {
    return function (event: React.MouseEvent<HTMLAnchorElement>) {
      let field = document.getElementById(id) as HTMLElement | null
      if (!field) {
        const elementsByName = document.getElementsByName(id)
        if (elementsByName.length > 0) {
          field = elementsByName[0]
        }
      }
      if (field) {
        const scrollToElement = (field.previousElementSibling as HTMLElement) || field
        FormUtil.scrollTo(scrollToElement, 700, function () {
          field!.focus()
        })
      } else {
        console.error('Can not scroll to field, because not found ' + id)
      }
      event.preventDefault()
    }
  }

  const renderFieldErrors = (
    formContent: Field[],
    field: Field,
    closestParent: Field,
    errors: ValidationError[],
    lang: Language
  ): React.ReactElement => {
    const fieldErrors: React.ReactElement[] = []
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

  const fieldErrorMessageElements = fieldsWithErrorsAndClosestParents.map((x) => {
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
        {translator.translate('validation-errors', lang, undefined, {
          kpl: String(invalidFieldsCount),
        })}
      </a>
      <div className="popup validation-errors" hidden={!open}>
        {fieldErrorMessageElements}
      </div>
    </div>
  )
}
