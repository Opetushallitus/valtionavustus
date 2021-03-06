import Immutable from 'seamless-immutable'
import _ from 'lodash'

import InputValueStorage from './InputValueStorage'
import SyntaxValidator from './SyntaxValidator'
import JsUtil from '../JsUtil'

export default class FieldUpdateHandler {
  static createFieldUpdate(field, value, customFieldSyntaxValidator) {
    return {id: field.id,
            field: field,
            value: value,
            fieldType: field.fieldType,
            validationErrors:
            SyntaxValidator.validateSyntax(field, value, customFieldSyntaxValidator) }
  }

  static updateStateFromFieldUpdate(state, fieldUpdate) {
    fieldUpdate.growingParent = InputValueStorage.writeValue(state.form.content, state.saveStatus.values, fieldUpdate)
    if (fieldUpdate.validationErrors) {
      if(_.isEmpty(state.form.validationErrors)) {
        state.form.validationErrors = Immutable({})
      }
      state.form.validationErrors = state.form.validationErrors.merge({[fieldUpdate.id]: fieldUpdate.validationErrors})
    }
  }

  static triggerRelatedFieldValidationIfNeeded(state, triggeringFieldUpdate) {
    const growingFieldSet = triggeringFieldUpdate.growingParent
    if (growingFieldSet) {
      const triggeringFieldId = triggeringFieldUpdate.id
      const myGroup = JsUtil.findJsonNodeContainingId(growingFieldSet.children, triggeringFieldId)
      const fieldsToValidate = JsUtil.flatFilter(myGroup, f => { return !_.isUndefined(f.id) && f.fieldClass === "formField" && f.id !== triggeringFieldId })
      FieldUpdateHandler.triggerFieldUpdatesForValidation(fieldsToValidate, state)
      return !_.isEmpty(fieldsToValidate)
    }
    return false
  }

  static triggerFieldUpdatesForValidation(fieldsToValidate, state) {
    _.forEach(fieldsToValidate, fieldToValidate => {
      const value = InputValueStorage.readValue(state.form.content, state.saveStatus.values, fieldToValidate.id)
      const fieldUpdate = FieldUpdateHandler.createFieldUpdate(fieldToValidate, value, state.extensionApi.customFieldSyntaxValidator)
      FieldUpdateHandler.updateStateFromFieldUpdate(state, fieldUpdate)
    })
  }
}
