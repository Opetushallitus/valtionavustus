import _ from 'lodash'

import FormUtil from '../FormUtil.js'

export default class FormEditorController {
  constructor(props) {
    this.formDraftJson = props.formDraftJson
    this.onEditCallback = props.onFormEdited
  }

  removeField(field) {
    const fieldMatcher = f => { return f.id === field.id }
    const parent = FormUtil.findFieldWithDirectChild(this.formDraftJson.content, field.id)
    if (parent) {
      _.remove(parent.children, fieldMatcher)
    } else {
      _.remove(this.formDraftJson.content, fieldMatcher)
    }
    this.onEditCallback(JSON.stringify(this.formDraftJson, null, 2), field)
  }
}
