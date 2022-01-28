import _ from 'lodash'

import FormBranchGrower from './FormBranchGrower'
import {
  createFieldUpdate, FieldUpdate,
  triggerFieldUpdatesForValidation
} from './FieldUpdateHandler'
import InputValueStorage from './InputValueStorage'
import JsUtil from '../JsUtil'
import FormUtil from './FormUtil'
import {Field} from "soresu-form/web/va/types";

export function ensureFirstChildIsRequired(state: any, growingParent: Field) {
  const firstChildOfGrowingSet = _.head(growingParent.children)!
  const prototypeForm = state.configuration.form
  const answersObject = state.saveStatus.values
  const syntaxValidator = state.extensionApi.customFieldSyntaxValidator
  const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(prototypeForm.content, growingParent.id)
  const answersToDelete: string[] = []
  const answersToWrite: FieldUpdate[] = []
  const validationErrorsToDelete: string[] = []

  const processFirstChildChildren = (operation: (f: Field) => void) => {
    _.forEach(JsUtil.flatFilter(firstChildOfGrowingSet, (n: Field) => !_.isUndefined(n.id)), operation)
  }

  processFirstChildChildren((n: Field) => {
    if (!_.isUndefined(n.id) && n.fieldClass === "formField") {
      const prototypeNode = FormUtil.findFieldIgnoringIndex(childPrototype, n.id)!
      const existingInputValue = InputValueStorage.readValue(null, answersObject, n.id)
      answersToWrite.push(createFieldUpdate(prototypeNode, existingInputValue, syntaxValidator))
      validationErrorsToDelete.push(n.id)
    } else if (n.children) {
      answersToDelete.push(n.id)
    }
  })

  answersToDelete.forEach(fieldIdToEmpty => {
    InputValueStorage.deleteValue(growingParent, answersObject, fieldIdToEmpty)
  })

  processFirstChildChildren((n: Field) => {
    const prototypeNode = FormUtil.findFieldIgnoringIndex(childPrototype, n.id)!
    n.id = prototypeNode?.id
    if (prototypeNode?.required) {
      n.required = true
    }
  })

  answersToWrite.forEach(fieldUpdate => {
    InputValueStorage.writeValue(prototypeForm, answersObject, fieldUpdate)
  })

  growingParent.children?.sort((firstChild: Field, secondChild: Field) => {
    return JsUtil.naturalCompare(firstChild.id, secondChild.id)
  })

  // clear validation errors from the original position of moved field
  state.form.validationErrors = state.form.validationErrors.without(validationErrorsToDelete)

  const fieldsToValidate = JsUtil.flatFilter(
    firstChildOfGrowingSet,
    (f: Field) => !_.isUndefined(f.id) && f.fieldClass === "formField"
  )
  triggerFieldUpdatesForValidation(fieldsToValidate, state)
}
