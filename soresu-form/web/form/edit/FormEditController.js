import _ from 'lodash'
import slug from 'slug'

import FormUtil from '../FormUtil.js'
import JsUtil from '../JsUtil.js'

export default class FormEditorController {
  constructor(props) {
    this.formDraftJson = props.formDraftJson
    this.onEditCallback = props.onFormEdited
  }

  editField(fieldId, valueContainerGetter, valueName, newValue) {
    const fieldFromJson = FormUtil.findField(this.formDraftJson.content, fieldId)
    valueContainerGetter(fieldFromJson)[valueName] = newValue
    this.onEditCallback(JSON.stringify(this.formDraftJson, null, 2))
  }

  removeField(field) {
    const fieldMatcher = f => { return f.id === field.id }
    const parent = FormUtil.findFieldWithDirectChild(this.formDraftJson.content, field.id)
    if (parent) {
      _.remove(parent.children, fieldMatcher)
    } else {
      _.remove(this.formDraftJson.content, fieldMatcher)
    }
    this.onEditCallback(JSON.stringify(this.formDraftJson, null, 2))
  }

  addChildFieldTo(parentField) {
    const newFieldType = "textField"
    const formDraftJson = this.formDraftJson

    function generateUniqueId(index) {
      const proposed = slug(newFieldType) + index
      if (_.isEmpty(JsUtil.flatFilter(formDraftJson.content, n => { return n.id === proposed}))) {
        return proposed
      }
      return generateUniqueId(index + 1)
    }

    const newId = generateUniqueId(0)
    const newChild = {
      "params": {
        "size": "large",
        "maxlength": 80
      },
      "fieldClass": "formField",
      "helpText": {
        "fi": "Ohjeteksti",
        "sv": "Hjälp på svenska"
      },
      "label": {
        "fi": "Kuvaus",
        "sv": "Kuvaus"
      },
      "id": newId,
      "required": true,
      "fieldType": newFieldType
    }
    const parent = FormUtil.findField(formDraftJson.content, parentField.id)
    if (_.isArray(parent)) {
      parent.push(newChild)
    } else {
      parent.children.push(newChild)
    }
    this.onEditCallback(JSON.stringify(formDraftJson, null, 2))
  }
}
