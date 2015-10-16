import Immutable from 'seamless-immutable'
import _ from 'lodash'

import InputValueStorage from './InputValueStorage.js'
import SyntaxValidator from './SyntaxValidator.js'
import JsUtil from './JsUtil.js'

export default class FieldUpdateHandler {
  static createFieldUpdate(field, value) {
    return {id: field.id,
            field: field,
            value: value,
            validationErrors:
            SyntaxValidator.validateSyntax(field, value) };
  }

  static updateStateFromFieldUpdate(state, fieldUpdate) {
    const growingParentIfFound = InputValueStorage.writeValue(state.form.content, state.saveStatus.values, fieldUpdate.id, fieldUpdate.value)
    fieldUpdate.growingParent = growingParentIfFound
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
      FieldUpdateHandler.triggerFieldUpdatesForValidation(fieldsToValidate, state);
      return !_.isEmpty(fieldsToValidate)
    }
    return false
  }

  static triggerFieldUpdatesForValidation(fieldsToValidate, state) {
    _.forEach(fieldsToValidate, fieldToValidate => {
      const value = InputValueStorage.readValue(state.form.content, state.saveStatus.values, fieldToValidate.id)
      const fieldUpdate = FieldUpdateHandler.createFieldUpdate(fieldToValidate, value)
      FieldUpdateHandler.updateStateFromFieldUpdate(state, fieldUpdate)
    })
  }
}
