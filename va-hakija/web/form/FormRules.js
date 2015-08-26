import _ from 'lodash'

import JsUtil from './JsUtil.js'
import FormUtil from './FormUtil.js'
import FormBranchGrower from './FormBranchGrower.js'
import InputValueStorage from './InputValueStorage.js'

export default class FormRules {

  static applyRulesToForm(formSpecification, formContent, values) {
    for (var i = 0; i < formSpecification.rules.length; i++) {
      const rule = formSpecification.rules[i]
      switch(rule.type) {
        case "includeIf":
          formContent = FormRules.handleIncludeIf(rule, formSpecification, formContent, values)
          break;
        default:
          console.error("Unsupported rule", rule)
      }
    }
    return formContent
  }

  static handleIncludeIf(rule, formSpecification, formContent, values) {
    const triggeringId = rule.triggeringId
    const triggeringValue = rule.params.triggeringValue
    const includeIds = rule.targetIds
    const doInclude = InputValueStorage.readValue(formContent, values, triggeringId) === triggeringValue
    console.log(triggeringId, InputValueStorage.readValue(formContent, values, triggeringId), triggeringValue, "include", includeIds, doInclude)
    for(var i = 0; i < includeIds.length; i++) {
      const includeId = includeIds[i]
      const fieldParentFromSpecification = FormUtil.findFieldWithDirectChild(formSpecification.content, includeId)
      const fieldParent = FormUtil.findField(formContent, fieldParentFromSpecification.id)
      if(fieldParent && fieldParent.children) {
        if(doInclude) {
          if(!FormUtil.findField(formContent, includeId)) {
            const newField = FormUtil.findField(formSpecification.content, includeId)
            const newFieldIndex = FormUtil.findChildIndexAccordingToFieldSpecification(fieldParentFromSpecification.children, fieldParent.children, includeId)
            fieldParent.children.splice(newFieldIndex, 0, newField.asMutable({deep: true}))
            FormBranchGrower.addFormFieldsForGrowingFieldsInInitialRender(fieldParent, values)
          }
        }
        else {
          _.remove(fieldParent.children, function(child) {
            return child.id === includeId;
          })
        }
      }
    }
    return formContent
  }
}