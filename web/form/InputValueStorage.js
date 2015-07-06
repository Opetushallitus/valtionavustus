import FormUtil from './FormUtil.js'
import JsUtil from './JsUtil.js'

import _ from 'lodash'

export default class InputValueStorage {
  static writeValue(formContent, answersObject, fieldId, newValue) {
    function writeChildValue(parentObject, childKey, value) {
      const existingChildren = _.filter(parentObject.value, child => { return child.key === childKey })
      if (!_.isUndefined(existingChildren) && !_.isEmpty(existingChildren)) {
        existingChildren[0].value = value
        return
      }
      if (_.isUndefined(parentObject.value)) {
        parentObject.value = []
      }
      parentObject.value.push({ "key": childKey, "value": value})
    }

    const growingParent = FormUtil.findGrowingParent(formContent, fieldId)
    if (!growingParent) {
      writeChildValue(answersObject, fieldId, newValue)
      return
    }

    var growingParentExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    if (_.isEmpty(growingParentExistingValues)) {
      writeChildValue(answersObject, growingParent.id, [])
      growingParentExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    }
    const repeatingItemField = JsUtil.findJsonNodeContainingId(growingParent.children, fieldId)
    var repeatingItemExistingValues = JsUtil.flatFilter(growingParentExistingValues, n => { return n.key === repeatingItemField.id })
    if (_.isEmpty(repeatingItemExistingValues)) {
      writeChildValue(growingParentExistingValues[0], repeatingItemField.id, [])
      repeatingItemExistingValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    }
    writeChildValue(repeatingItemExistingValues[0], fieldId, newValue)

    return growingParent
  }

  static readValue(formContent, answersObject, fieldId) {
    const existingValueObject = JsUtil.flatFilter(answersObject, n => { return n.key === fieldId })
    return !_.isEmpty(existingValueObject) ? existingValueObject[0].value : ""
  }

  static deleteValue(growingParent, answersObject, idOfFieldToRemove) {
    if (answersObject[growingParent.id]) {
      delete answersObject[growingParent.id][idOfFieldToRemove]
    }
  }
}
