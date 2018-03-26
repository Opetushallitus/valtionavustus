import _ from 'lodash'

import FormBranchGrower from './FormBranchGrower'
import FieldUpdateHandler from './FieldUpdateHandler'
import InputValueStorage from './InputValueStorage'
import JsUtil from '../JsUtil'
import FormUtil from './FormUtil'

export default class FormBranchEditableFieldGrower {
  static ensureFirstChildIsRequired(state, growingParent) {
    const firstChildOfGrowingSet = _.first(growingParent.children)
    const prototypeForm = state.configuration.form
    const answersObject = state.saveStatus.values
    const syntaxValidator = state.extensionApi.customFieldSyntaxValidator
    const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(prototypeForm.content, growingParent.id)
    const answersToDelete = []
    const answersToWrite = []
    const validationErrorsToDelete = []

    const processFirstChildChildren = operation => {
      _.forEach(JsUtil.flatFilter(firstChildOfGrowingSet, n => !_.isUndefined(n.id)), operation)
    }

    processFirstChildChildren(n => {
      if (!_.isUndefined(n.id) && n.fieldClass === "formField") {
        const prototypeNode = FormUtil.findFieldIgnoringIndex(childPrototype, n.id)
        const existingInputValue = InputValueStorage.readValue(null, answersObject, n.id)
        answersToWrite.push(FieldUpdateHandler.createFieldUpdate(prototypeNode, existingInputValue, syntaxValidator))
        validationErrorsToDelete.push(n.id)
      } else if (n.children) {
        answersToDelete.push(n.id)
      }
    })

    _.forEach(answersToDelete, fieldIdToEmpty => {
      InputValueStorage.deleteValue(growingParent, answersObject, fieldIdToEmpty)
    })

    processFirstChildChildren(n => {
      const prototypeNode = FormUtil.findFieldIgnoringIndex(childPrototype, n.id)
      n.id = prototypeNode.id

      if (prototypeNode.required) {
        n.required = true
      }
    })

    _.forEach(answersToWrite, fieldUpdate => {
      InputValueStorage.writeValue(prototypeForm, answersObject, fieldUpdate)
    })

    growingParent.children.sort((firstChild, secondChild) => {
      return JsUtil.naturalCompare(firstChild.id, secondChild.id)
    })

    // clear validation errors from the original position of moved field
    state.form.validationErrors = state.form.validationErrors.without(validationErrorsToDelete)

    const fieldsToValidate = JsUtil.flatFilter(
      firstChildOfGrowingSet,
      f => !_.isUndefined(f.id) && f.fieldClass === "formField"
    )
    FieldUpdateHandler.triggerFieldUpdatesForValidation(fieldsToValidate, state)
  }
}
