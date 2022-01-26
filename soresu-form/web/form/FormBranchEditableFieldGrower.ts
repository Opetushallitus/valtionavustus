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

export function ensureFirstChildIsRequired(state: any, growingParent: any) {
  const firstChildOfGrowingSet = _.head(growingParent.children)
  const prototypeForm = state.configuration.form
  const answersObject = state.saveStatus.values
  const syntaxValidator = state.extensionApi.customFieldSyntaxValidator
  const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(prototypeForm.content, growingParent.id)
  const answersToDelete: string[] = []
  const answersToWrite: FieldUpdate[] = []
  const validationErrorsToDelete: string[] = []

  const processFirstChildChildren = (operation: any) => {
    _.forEach(JsUtil.flatFilter(firstChildOfGrowingSet, (n: Field) => !_.isUndefined(n.id)), operation)
  }

  processFirstChildChildren((n: any) => {
    if (!_.isUndefined(n.id) && n.fieldClass === "formField") {
      const prototypeNode = <Field><unknown>FormUtil.findFieldIgnoringIndex(childPrototype, n.id)
      const existingInputValue = InputValueStorage.readValue(null, answersObject, n.id)
      answersToWrite.push(createFieldUpdate(prototypeNode, existingInputValue, syntaxValidator))
      validationErrorsToDelete.push(n.id)
    } else if (n.children) {
      answersToDelete.push(n.id)
    }
  })

  _.forEach(answersToDelete, fieldIdToEmpty => {
    InputValueStorage.deleteValue(growingParent, answersObject, fieldIdToEmpty)
  })

  processFirstChildChildren((n: any) => {
    const prototypeNode = <Field><unknown>FormUtil.findFieldIgnoringIndex(childPrototype, n.id);
    n.id = prototypeNode.id
    if (prototypeNode.required) {
      n.required = true
    }

  })

  _.forEach(answersToWrite, fieldUpdate => {
    InputValueStorage.writeValue(prototypeForm, answersObject, fieldUpdate)
  })

  growingParent.children.sort((firstChild: any, secondChild: any) => {
    return JsUtil.naturalCompare(firstChild.id, secondChild.id)
  })

  // clear validation errors from the original position of moved field
  state.form.validationErrors = state.form.validationErrors.without(validationErrorsToDelete)

  const fieldsToValidate = JsUtil.flatFilter(
    firstChildOfGrowingSet,
    (f: any) => !_.isUndefined(f.id) && f.fieldClass === "formField"
  )
  triggerFieldUpdatesForValidation(fieldsToValidate, state)
}
