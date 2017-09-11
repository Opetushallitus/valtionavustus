import FormUtil from './FormUtil'
import JsUtil from '../JsUtil'

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

  static readValues(answersObject, fieldType) {
    return JsUtil.flatFilter(
      answersObject,
      n => !_.isUndefined(n) && !_.isNull(n) && n.fieldType === fieldType
    )
  }

  static readValue(_ignoredFormSpecificationContent, answersObject, fieldId) {
    const found = JsUtil.findFirst(
      answersObject,
      n => !_.isUndefined(n) && !_.isNull(n) && n.key === fieldId
    )

    if (found === null) {
      return ""
    }

    if (!_.isArray(found.value)) {
      // flat value
      return found.value
    }

    const firstElem = found.value[0]

    if (_.isArray(firstElem)) {
      // two-dimensional array
      return found.value
    }

    // one-dimensional array (e.g. growing fieldset child or checkbox with multiple values)

    const ary = found.value.slice(0)
    const comparisonFun = _.isObject(firstElem) && firstElem.key
      ? (a, b) => JsUtil.naturalCompare(a.key, b.key)
      : JsUtil.naturalCompare

     ary.sort(comparisonFun)

     return ary
  }

  static deleteValue(growingParent, answersObject, idOfFieldToRemove) {
    const parentValues = JsUtil.flatFilter(answersObject, n => { return n.key === growingParent.id })
    if (!_.isEmpty(parentValues)) {
      _.remove(parentValues[0].value, row => { return row.key === idOfFieldToRemove })
    }
  }
}
