import _ from 'lodash'

import JsUtil from './JsUtil.js'
import FormUtil from './FormUtil.js'
import FormBranchGrower from './FormBranchGrower.js'
import InputValueStorage from './InputValueStorage.js'

export default class FormRules {

  static applyRulesToForm(formSpecification, formState, values) {
    for (var i = 0; i < formSpecification.rules.length; i++) {
      const rule = formSpecification.rules[i]
      switch(rule.type) {
        case "includeIf":
          formState = FormRules.handleIncludeIf(rule, formSpecification, formState, values)
          break;
        default:
          console.error("Unsupported rule", rule)
      }
    }
    return formState
  }

  static handleIncludeIf(rule, formSpecification, formState, values) {
    const triggerId = rule.triggerId
    const triggerValue = rule.params.triggerValue
    const includeIds = rule.targetIds
    const doInclude = InputValueStorage.readValue(formState.content, values, triggerId) === triggerValue
    for(var i = 0; i < includeIds.length; i++) {
      FormRules.doIncludeOrRemoveField(doInclude, includeIds[i], formSpecification, formState, values)
    }
    return formState
  }

  static doIncludeOrRemoveField(doInclude, fieldId, formSpecification, formState, values) {
    const fieldParentFromSpecification = FormUtil.findFieldWithDirectChild(formSpecification.content, fieldId)
    const fieldParent = FormUtil.findField(formState.content, fieldParentFromSpecification.id)
    if(fieldParent && fieldParent.children) {
      const fieldToInclude = FormUtil.findField(formState.content, fieldId)
      if(doInclude) {
        if(!fieldToInclude) {
          FormRules.addNewField(fieldParent, fieldParentFromSpecification, fieldId, values)
        }
      }
      else {
        if(fieldToInclude) {
          FormRules.removeField(formState, fieldParent, fieldToInclude)
        }
      }
    }
    return formState
  }

  static addNewField(parentField, fieldParentFromSpecification, fieldId, values) {
    const newFieldPrototype = FormUtil.findField(fieldParentFromSpecification.children, fieldId)
    const newFieldIndex = FormUtil.findChildIndexAccordingToFieldSpecification(fieldParentFromSpecification.children, parentField.children, fieldId)
    parentField.children.splice(newFieldIndex, 0, newFieldPrototype.asMutable({deep: true}))
    FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(parentField, values)
    return parentField
  }

  static removeField(formState, parentField, fieldToRemove) {
    formState.validationErrors = formState.validationErrors.merge({[fieldToRemove.id]: []})
    const subFieldIds = FormUtil.findSubFieldIds(fieldToRemove)
    for(var i = 0; i < subFieldIds.length; i++) {
      formState.validationErrors = formState.validationErrors.merge({[subFieldIds[i]]: []})
    }
    _.remove(parentField.children, function(child) {
      return child.id === fieldToRemove.id;
    })
    return formState
  }
}