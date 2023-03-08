import Immutable from 'seamless-immutable'
import _ from 'lodash'

import InputValueStorage from './InputValueStorage'
import SyntaxValidator, { ValidationError, Validator } from './SyntaxValidator'
import JsUtil from '../JsUtil'
import { Field } from 'soresu-form/web/va/types'

export interface FieldUpdate {
  id: string
  field: Field
  value: any
  fieldType: string
  validationErrors: ValidationError[]
  growingParent?: any
}

export function createFieldUpdate(
  field: Field,
  value: any,
  customFieldSyntaxValidator?: typeof Validator
): FieldUpdate {
  return {
    id: field.id,
    field,
    value,
    fieldType: field.fieldType,
    validationErrors: SyntaxValidator.validateSyntax(field, value, customFieldSyntaxValidator),
  }
}

export function updateStateFromFieldUpdate(state: any, fieldUpdate: FieldUpdate) {
  fieldUpdate.growingParent = InputValueStorage.writeValue(
    state.form.content,
    state.saveStatus.values,
    fieldUpdate
  )
  if (fieldUpdate.validationErrors) {
    if (_.isEmpty(state.form.validationErrors)) {
      state.form.validationErrors = Immutable({})
    }
    state.form.validationErrors = state.form.validationErrors.merge({
      [fieldUpdate.id]: fieldUpdate.validationErrors,
    })
  }
}

export function triggerRelatedFieldValidationIfNeeded(
  state: any,
  triggeringFieldUpdate: FieldUpdate
) {
  const growingFieldSet = triggeringFieldUpdate.growingParent
  if (growingFieldSet) {
    const triggeringFieldId = triggeringFieldUpdate.id
    const myGroup =
      JsUtil.findJsonNodeContainingId<Field>(growingFieldSet.children, triggeringFieldId) ?? []
    const fieldsToValidate = JsUtil.flatFilter(myGroup, (f: Field) => {
      return !_.isUndefined(f.id) && f.fieldClass === 'formField' && f.id !== triggeringFieldId
    })
    triggerFieldUpdatesForValidation(fieldsToValidate, state)
    return !_.isEmpty(fieldsToValidate)
  }
  return false
}

export function triggerFieldUpdatesForValidation(fieldsToValidate: Field[], state: any) {
  _.forEach(fieldsToValidate, (fieldToValidate) => {
    const value = InputValueStorage.readValue(
      state.form.content,
      state.saveStatus.values,
      fieldToValidate.id
    )
    const fieldUpdate = createFieldUpdate(
      fieldToValidate,
      value,
      state.extensionApi.customFieldSyntaxValidator
    )
    updateStateFromFieldUpdate(state, fieldUpdate)
  })
}
