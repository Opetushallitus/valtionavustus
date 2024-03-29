import _ from 'lodash'

import FormUtil from './FormUtil'
import FormBranchGrower from './FormBranchGrower'
import InputValueStorage from './InputValueStorage'

export default class FormRules {
  static applyRulesToForm(formSpecification, formState, values) {
    for (let i = 0; i < formSpecification.rules.length; i++) {
      const rule = formSpecification.rules[i]
      switch (rule.type) {
        case 'includeIf':
          formState = FormRules.handleIncludeIf(rule, formSpecification, formState, values)
          break
        default:
          console.error('Unsupported rule of type', rule.type, rule)
      }
    }
    return formState
  }

  static handleIncludeIf(rule, formSpecification, formState, values) {
    const triggerId = rule.triggerId
    const triggerValue = rule.params.triggerValue
    const includeIds = rule.targetIds
    const doInclude =
      InputValueStorage.readValue(formState.content, values, triggerId) === triggerValue
    for (let i = 0; i < includeIds.length; i++) {
      FormRules.doIncludeOrRemoveField(
        doInclude,
        includeIds[i],
        formSpecification,
        formState,
        values
      )
    }
    return formState
  }

  static doIncludeOrRemoveField(doInclude, fieldId, formSpecification, formState, values) {
    const fieldParentFromSpecification = FormUtil.findFieldWithDirectChild(
      formSpecification.content,
      fieldId
    )
    const fieldParent = FormUtil.findField(formState.content, fieldParentFromSpecification.id)
    if (fieldParent && fieldParent.children) {
      const fieldToInclude = FormUtil.findField(formState.content, fieldId)
      if (doInclude) {
        if (!fieldToInclude) {
          FormRules.addNewField(fieldParent, fieldParentFromSpecification, fieldId, values)
        }
      } else {
        if (fieldToInclude) {
          FormRules.removeField(formState, fieldParent, fieldToInclude)
        }
      }
    }
    return formState
  }

  static addNewField(parentField, fieldParentFromSpecification, fieldId, values) {
    const newFieldPrototype = FormUtil.findField(fieldParentFromSpecification.children, fieldId)
    const newFieldIndex = FormUtil.findChildIndexAccordingToFieldSpecification(
      fieldParentFromSpecification.children,
      parentField.children,
      fieldId
    )
    parentField.children.splice(newFieldIndex, 0, newFieldPrototype.asMutable({ deep: true }))
    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(
      fieldParentFromSpecification,
      parentField,
      values,
      true
    )
    return parentField
  }

  static removeField(formState, parentField, fieldToRemove) {
    formState.validationErrors = formState.validationErrors.merge({
      [fieldToRemove.id]: [],
    })
    const subFieldIds = FormUtil.findSubFieldIds(fieldToRemove)
    for (let i = 0; i < subFieldIds.length; i++) {
      formState.validationErrors = formState.validationErrors.merge({
        [subFieldIds[i]]: [],
      })
    }
    _.remove(parentField.children, function (child) {
      return child.id === fieldToRemove.id
    })
    return formState
  }
}
