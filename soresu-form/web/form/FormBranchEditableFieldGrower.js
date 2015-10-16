import _ from 'lodash'

import FormBranchGrower from './FormBranchGrower'
import FieldUpdateHandler from './FieldUpdateHandler.js'
import JsUtil from './JsUtil.js'
import FormUtil from './FormUtil.js'

export default class FormBranchEditableFieldGrower {
  static ensureFirstChildIsRequired(state, growingParent) {
    const firstChildOfGrowingSet = _.first(growingParent.children)
    const childPrototype = FormBranchGrower.getGrowingFieldSetChildPrototype(state.configuration.form.content, growingParent.id)
    _.forEach(JsUtil.flatFilter(firstChildOfGrowingSet, n => { return !_.isUndefined(n.id) }), n => {
      const grandChildPrototype = FormUtil.findFirstFieldIgnoringIndex(childPrototype, n.id)
      n.id = grandChildPrototype.id
      if (grandChildPrototype.required) {
        n.required = true
      }
    })
    const fieldsToValidate = JsUtil.flatFilter(_.first(growingParent.children), f => { return !_.isUndefined(f.id) && f.fieldClass === "formField"})
    FieldUpdateHandler.triggerFieldUpdatesForValidation(fieldsToValidate, state)
  }
}
