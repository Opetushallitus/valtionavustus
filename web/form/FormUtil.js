import _ from 'lodash'

import JsUtil from './JsUtil.js'

export default class FormUtil {
  static findField(formContent, fieldId) {
    const foundArray = JsUtil.flatFilter(formContent, n => { return n.id === fieldId })
    return _.first(foundArray)
  }

  static findFieldWithDirectChild(formContent, childId) {
    const parentsArray = JsUtil.flatFilter(formContent, n => { return _.some(n.children, c => { return c.id === childId })})
    return _.first(parentsArray)
  }

  static findGrowingParent(formContent, fieldId) {
    const allGrowingFieldsets = JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset" })
    return JsUtil.findJsonNodeContainingId(allGrowingFieldsets, fieldId)
  }

  static isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }
}