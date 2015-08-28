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
    const triggeringId = rule.triggeringId
    const triggeringValue = rule.params.triggeringValue
    const includeIds = rule.targetIds
    const doInclude = InputValueStorage.readValue(formState.content, values, triggeringId) === triggeringValue
    console.log(triggeringId, InputValueStorage.readValue(formState.content, values, triggeringId), triggeringValue, "include", includeIds, doInclude)
    for(var i = 0; i < includeIds.length; i++) {
      const includeId = includeIds[i]
      const fieldParentFromSpecification = FormUtil.findFieldWithDirectChild(formSpecification.content, includeId)
      const fieldParent = FormUtil.findField(formState.content, fieldParentFromSpecification.id)
      if(fieldParent && fieldParent.children) {
        const fieldToInclude = FormUtil.findField(formState.content, includeId)
        if(doInclude) {
          if(!fieldToInclude) {
            const newField = FormUtil.findField(formSpecification.content, includeId)
            const newFieldIndex = FormUtil.findChildIndexAccordingToFieldSpecification(fieldParentFromSpecification.children, fieldParent.children, includeId)
            fieldParent.children.splice(newFieldIndex, 0, newField.asMutable({deep: true}))
            FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(fieldParent, values)
          }
        }
        else {
          if(fieldToInclude) {
            formState.validationErrors = formState.validationErrors.merge({[includeId]: []})
            const subFieldIds = FormUtil.findSubFieldIds(fieldToInclude)
            for(var i = 0; i < subFieldIds.length; i++) {
              formState.validationErrors = formState.validationErrors.merge({[subFieldIds[i]]: []})
            }
            _.remove(fieldParent.children, function(child) {
              return child.id === includeId;
            })
          }
        }
      }
    }
    return formState
  }
}