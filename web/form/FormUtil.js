import JsUtil from './JsUtil.js'

export default class FormUtil {
  static findGrowingParent(formContent, fieldId) {
    const allGrowingFieldsets = JsUtil.flatFilter(formContent, n => { return n.displayAs === "growingFieldset" })
    return JsUtil.findJsonNodeContainingId(allGrowingFieldsets, fieldId)
  }

  static isNumeric(n) {
    return !isNaN(parseFloat(n)) && isFinite(n)
  }
}