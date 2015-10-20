import FormUtil from './FormUtil.js'
import JsUtil from './JsUtil.js'

import _ from 'lodash'

export default class InputValueStorage {
  static writeValue(formSpecificationContent, answersObject, fieldUpdate) {
    const fieldId = fieldUpdate.id
    const field = fieldUpdate.field
    const newValue = fieldUpdate.value
    function writeChildValue(parentObject, childField, value) {
      const childKey = childField.id
      const existingChildren = _.filter(parentObject.value, childValueObject => { return childValueObject.key === childKey })
      if (!_.isUndefined(existingChildren) && !_.isEmpty(existingChildren)) {
        existingChildren[0].value = value
        return
      }
      if (_.isUndefined(parentObject.value)) {
        parentObject.value = []
      }
      parentObject.value.push({"key": childKey, "value": value, "fieldType": childField.fieldType})
    }

    const growingParent = FormUtil.findGrowingParent(formSpecificationContent, fieldId)
    if (!growingParent) {
      writeChildValue(answersObject, field, newValue)
      return
    }

    var growingParentExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    if (_.isEmpty(growingParentExistingValues)) {
      writeChildValue(answersObject, growingParent, [])
      growingParentExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    }
    const repeatingItemField = JsUtil.findJsonNodeContainingId(growingParent.children, fieldId)
    var repeatingItemExistingValues = JsUtil.flatFilter(growingParentExistingValues, n => { return n.key === repeatingItemField.id })
    if (_.isEmpty(repeatingItemExistingValues)) {
      writeChildValue(growingParentExistingValues[0], repeatingItemField, [])
      repeatingItemExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === repeatingItemField.id })
    }
    writeChildValue(repeatingItemExistingValues[0], field, newValue)

    return growingParent
  }

  static readValue(formSpecificationContent, answersObject, fieldId) {
    const existingValueObject = JsUtil.flatFilter(answersObject, n => { return !_.isUndefined(n) && !_.isNull(n) && n.key === fieldId })
    return !_.isEmpty(existingValueObject) ? existingValueObject[0].value : ""
  }

  static deleteValue(growingParent, answersObject, idOfFieldToRemove) {
    const parentValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    if (!_.isEmpty(parentValues)) {
      _.remove(parentValues[0].value, row => { return row.key === idOfFieldToRemove })
    }
  }
}
