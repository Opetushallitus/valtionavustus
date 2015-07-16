import _ from 'lodash'

import JsUtil from './JsUtil.js'

export default class FormUtil {
  static scrollTo(element, duration, afterScroll) {
    const aboutSame = function(current, target) {
      return Math.abs(current - target) < 1
    }
    const startScrollPos = window.pageYOffset
    const offsetFromTop = document.getElementById("container").getBoundingClientRect().top + startScrollPos + 30
    const targetScrollPos = element.getBoundingClientRect().top + startScrollPos - offsetFromTop
    if (aboutSame(startScrollPos, targetScrollPos)) {
      afterScroll()
      return
    }
    const diff = targetScrollPos - startScrollPos
    const scrollStep = Math.PI / (duration / 10)
    var count = 0
    const scrollInterval = setInterval(function(){
      count = count + 1
      const nextScrollPos = startScrollPos + diff * (0.5 - 0.5 * Math.cos(count * scrollStep))
      window.scrollTo (0, nextScrollPos)
      if(aboutSame(nextScrollPos, targetScrollPos)) {
        clearInterval(scrollInterval)
        afterScroll()
      }
    },10)
  }

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