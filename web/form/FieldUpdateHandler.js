import FormModel from './FormModel.js'
import InputValueStorage from './InputValueStorage.js'
import {SyntaxValidator} from './SyntaxValidator.js'
import JsUtil from '../form/JsUtil.js'

import Immutable from 'seamless-immutable'
import _ from 'lodash'

export default class FieldUpdateHandler {
  static createFieldUpdate(field, value) {
    return {id: field.id,
            field: field,
            value: value,
            validationErrors:
            SyntaxValidator.validateSyntax(field, value) };
  }

  static updateStateFromFieldUpdate(state, fieldUpdate) {
    const growingParentIfFound = InputValueStorage.writeValue(state.form, state.saveStatus.values, fieldUpdate.id, fieldUpdate.value)
    fieldUpdate.growingParent = growingParentIfFound
    if (fieldUpdate.validationErrors) {
      if(_.isEmpty(state.validationErrors)) {
        state.validationErrors = Immutable({})
      }
      state.validationErrors = state.validationErrors.merge({[fieldUpdate.id]: fieldUpdate.validationErrors})
      state.clientSideValidation[fieldUpdate.id] = fieldUpdate.validationErrors.length === 0
    } else {
      state.clientSideValidation[fieldUpdate.id] = true
    }
  }


  static triggerRelatedFieldValidationIfNeeded(state, triggeringFieldUpdate) {
    const growingFieldSet = triggeringFieldUpdate.growingParent
    if (growingFieldSet) {
      const triggeringFieldId = triggeringFieldUpdate.id
      const myGroup = JsUtil.findJsonNodeContainingId(growingFieldSet.children, triggeringFieldId)
      const fieldsToValidate = JsUtil.flatFilter(myGroup, f => { return !_.isUndefined(f.id) && f.type === "formField" && f.id !== triggeringFieldId })
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