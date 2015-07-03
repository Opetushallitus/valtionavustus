import FormModel from './FormModel.js'
import JsUtil from './JsUtil.js'

import _ from 'lodash'

export default class InputValueStorage {
  static writeValue(formContent, answersObject, fieldId, newValue) {
    function addChildObjectIfDoesNotExist(parentObject, childId) {
      if (!parentObject[childId]) {
        parentObject[childId] = {}
      }
    }
    const growingParent = FormModel.findGrowingParent(formContent, fieldId)
    if (!growingParent) {
      answersObject[fieldId] = newValue
      return
    }
    addChildObjectIfDoesNotExist(answersObject, growingParent.id)
    const itemOfField = JsUtil.findJsonNodeContainingId(growingParent.children, fieldId)
    addChildObjectIfDoesNotExist(answersObject[growingParent.id], itemOfField.id)
    answersObject[growingParent.id][itemOfField.id][fieldId] = newValue
    return growingParent
  }

  static readValue(formContent, answersObject, fieldId) {
    const growingParentOfField = FormModel.findGrowingParent(formContent, fieldId)
    if (!growingParentOfField) {
      return answersObject ? answersObject[fieldId] : ""
    }
    const foundParentArray = JsUtil.flatFilter(answersObject, n => { return n && !_.isUndefined(n[fieldId]) })
    if (foundParentArray.length === 0) {
      return ""
    }
    return foundParentArray[0][fieldId]
  }

  static deleteValue(growingParent, answersObject, idOfFieldToRemove) {
    if (answersObject[growingParent.id]) {
      delete answersObject[growingParent.id][idOfFieldToRemove]
    }
  }
}
