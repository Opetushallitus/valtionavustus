import _ from "lodash"

import FormUtil from "../FormUtil"
import JsUtil from "../../JsUtil"

const fieldTypes = {
  "textField": "formField",
  "textArea": "formField",
  "radioButton": "formField",
  "checkboxButton": "formField",
  "dropdown": "formField",
  "namedAttachment": "formField",
  "koodistoField": "formField",
  "p": "infoElement",
  "h3": "infoElement",
  "link": "infoElement",
  "theme": "wrapperElement",
  "fieldset": "wrapperElement",
  "growingFieldset": "wrapperElement",
  "growingFieldsetChild": "wrapperElement"
}

export default class FormEditorController {

  static addableFieldTypes() {
    return fieldTypes
  }

  constructor(props) {
    this.formDraftJson = props.formDraftJson
    this.onEditCallback = props.onFormEdited
    this.allowEditing = props.allowEditing
    this.readOnlyNotificationText = props.readOnlyNotificationText
  }

  doEdit(operation) {
    if (this.allowEditing) {
      const result = operation()
      this.onEditCallback(JSON.stringify(this.formDraftJson, null, 2), result)
    }
  }

  editField(fieldId, valueContainerGetter, valueName, newValue) {
    this.doEdit(() => {
      const fieldFromJson = FormUtil.findField(this.formDraftJson.content, fieldId)
      valueContainerGetter(fieldFromJson)[valueName] = newValue
    })
  }

  removeField(field) {
    this.doEdit(() => {
      const fieldMatcher = f => { return f.id === field.id }
      const parent = FormUtil.findFieldWithDirectChild(this.formDraftJson.content, field.id)
      if (parent) {
        _.remove(parent.children, fieldMatcher)
      } else {
        _.remove(this.formDraftJson.content, fieldMatcher)
      }
    })
  }

  moveField(field, indexDelta) {
    this.doEdit(() => {
      const parent = FormUtil.findFieldWithDirectChild(this.formDraftJson.content, field.id)
      const fields = parent ? parent.children : this.formDraftJson.content
      const oldIndex = fields.findIndex(f => f.id === field.id)
      const newIndex = oldIndex + indexDelta

      if (newIndex < 0 || newIndex > (fields.length - 1)) {
        return
      }

      const item = fields[oldIndex]
      const fieldsWithoutItem = fields.slice(0, oldIndex).concat(fields.slice(oldIndex + 1))
      const updatedFields = fieldsWithoutItem.slice(0, newIndex).concat(
        item, fieldsWithoutItem.slice(newIndex))

      if (parent) {
        parent.children = updatedFields
      } else {
        this.formDraftJson.content = updatedFields
      }
    })
  }

  getFieldClassProps(fieldClass) {
    switch (fieldClass) {
      case "formField":
        return {
          label: { "fi": "", "sv": "" },
          helpText: { "fi": "", "sv": "" },
          required: true
        }
      case "infoElement":
        return {}
      case "wrapperElement":
        return { children: [] }
      default:
        throw new Error(`Don't know how to create field of class '${fieldClass}'`)
    }
  }

  getFieldTypeProps(fieldType, id) {
    switch (fieldType) {
      case "moneyField":
      case "emailField":
      case "namedAttachment":
      case "theme":
      case "fieldset":
        return {}
      case "growingFieldsetChild":
        return {
          children: [
            this.createNewField("textField",
              this.generateUniqueId(`${id}.textField`, 0, "_"))
          ]
        }
      case "growingFieldset":
        return {
          children: [
            this.createNewField("growingFieldsetChild",
              this.generateUniqueId(`${id}-growingFieldsetChild`, 0))
          ],
          params: { "showOnlyFirstLabels": true }
        }
      case "textField":
      case "koodistoField":
      case "textArea":
        return {
          params: {
            maxlength: 100,
            size: "medium"
          }
        }
      case "radioButton":
      case "dropdown":
      case "checkboxButton":
        return {
          options: [
            FormEditorController.createEmptyOption(),
            FormEditorController.createEmptyOption()
          ]
        }
      case "link":
        return {
          params: {
            href: {"fi": "http://www.oph.fi/", "sv": "http://www.oph.fi/"}
          }
        }
      case "p":
      case "h3":
        return {
          text: {"fi": "", "sv": ""}
        }
      default:
        throw new Error(`Don't know how to create field of type '${fieldType}'`)
    }
  }

  createNewField(fieldType, id) {
    const fieldClass = FormEditorController.addableFieldTypes()[fieldType]
    const newField = Object.assign(
      {
        "params": {},
        "fieldClass": fieldClass,
        "fieldType": fieldType,
        "id": id
      },
      this.getFieldClassProps(fieldClass),
      this.getFieldTypeProps(fieldType, id)
    )

    return newField
  }

  findElementsById(id) {
    return JsUtil.flatFilter(
      this.formDraftJson.content, n => n.id === id)
  }

  generateUniqueId(baseId, index, delimiter = "-") {
    const proposed = `${baseId}${delimiter}${index}`
    if (_.isEmpty(this.findElementsById(proposed))) {
      return proposed
    }
    return this.generateUniqueId(baseId, index + 1, delimiter)
  }

  addChildFieldAfter(fieldToAddAfter, newFieldType) {
    this.doEdit(() => {
      const formDraftJson = this.formDraftJson
      const parentField = FormUtil.findFieldWithDirectChild(formDraftJson.content, fieldToAddAfter.id)
      const childArray = parentField ? parentField.children : formDraftJson.content
      const fieldToAddAfterOnForm = FormUtil.findField(formDraftJson.content, fieldToAddAfter.id)
      const indexOfNewChild = childArray.indexOf(fieldToAddAfterOnForm) + 1

      const newId = parentField &&
        parentField.fieldType === "growingFieldsetChild" ?
        this.generateUniqueId(
          `${parentField.id}.${newFieldType}`, 0, "_") :
        this.generateUniqueId(newFieldType, 0)
      const newChild = this.createNewField(newFieldType, newId)

      const parent = parentField ? FormUtil.findField(formDraftJson.content, parentField.id) : formDraftJson.content
      if (_.isArray(parent)) {
        parent.splice(indexOfNewChild, 0, newChild)
      } else {
        parent.children.splice(indexOfNewChild, 0, newChild)
      }
      return newChild
    })
  }

  static createEmptyOption() {
    return { "value": "", "label": { "fi": "", "sv": "" } }
  }

  appendOption(radioButtonField) {
    this.doEdit(() => {
      const fieldInForm = FormUtil.findField(this.formDraftJson.content, radioButtonField.id)
      fieldInForm.options.push(FormEditorController.createEmptyOption())
    })
  }

  removeOption(radioButtonField, optionToRemove) {
    this.doEdit(() => {
      const fieldInForm = FormUtil.findField(this.formDraftJson.content, radioButtonField.id)
      _.remove(fieldInForm.options, optionToRemove)
    })
  }
}
