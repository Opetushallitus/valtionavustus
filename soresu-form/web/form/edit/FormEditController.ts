import _ from "lodash"

import { Field, FieldType, Form, Option, fieldTypes, FieldClass, AddableFieldType } from "soresu-form/web/va/types"

interface FormEditControllerProps {
  formDraft: Form
  onFormEdited: () => any
  allowEditing: boolean
  readOnlyNotificationText: string
}

export default class FormEditorController {
  formDraft: Form
  onEditCallback: any
  allowEditing: boolean
  readOnlyNotificationText: string

  constructor(props: FormEditControllerProps) {
    this.formDraft = props.formDraft
    this.onEditCallback = props.onFormEdited
    this.allowEditing = props.allowEditing
    this.readOnlyNotificationText = props.readOnlyNotificationText
  }

  doEdit(operation: () => any) {
    if (this.allowEditing) {
      const result = operation()
      this.onEditCallback(this.formDraft, result)
    }
  }

  editField(fieldId: string, valueContainerGetter: (s: Field) => any, valueName: string, newValue: string) {
    this.doEdit(() => {
      const fieldFromJson = this.formDraft.content.find(f => f.id === fieldId)
      if (fieldFromJson) {
        valueContainerGetter(fieldFromJson)[valueName] = newValue
      }
    })
  }

  removeField(field: Field) {
    this.doEdit(() => {
      const fieldMatcher = (f: Field) => { return f.id === field.id }
      const parent = this.formDraft.content.find(f => f.children?.some(c => c.id === field.id))
      if (parent?.children) {
        _.remove(parent.children, fieldMatcher)
      } else {
        _.remove(this.formDraft.content, fieldMatcher)
      }
    })
  }

  moveField(field: Field, indexDelta: number) {
    this.doEdit(() => {
      const parent = this.formDraft.content.find(f => f.children?.some(c => c.id === field.id))
      const fields = parent ? parent.children! : this.formDraft.content
      const oldIndex = fields.findIndex((f: Field) => f.id === field.id)
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
        this.formDraft.content = updatedFields
      }
    })
  }

  getFieldClassProps(fieldClass: FieldClass) {
    switch (fieldClass) {
      case "formField":
        return {
          label: { fi: "", sv: "" },
          helpText: { fi: "", sv: "" },
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

  getFieldTypeProps(fieldType: FieldType, id: string): any {
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
          params: { showOnlyFirstLabels: true }
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
            href: { fi: "http://www.oph.fi/", sv: "http://www.oph.fi/"}
          }
        }
      case "p":
      case "h3":
        return {
          text: { fi: "", sv: ""}
        }
      default:
        throw new Error(`Don't know how to create field of type '${fieldType}'`)
    }
  }

  createNewField(fieldType: AddableFieldType, id: string): Field {
    const fieldClass = fieldTypes[fieldType]
    const newField = Object.assign(
      {
        params: {},
        fieldClass,
        fieldType,
        id
      },
      this.getFieldClassProps(fieldClass),
      this.getFieldTypeProps(fieldType, id)
    )

    return newField
  }

  generateUniqueId(baseId: FieldType | string, index: number, delimiter = "-"): string {
    const proposed = `${baseId}${delimiter}${index}`
    if (!this.formDraft.content.find(f => f.id === proposed)) {
      return proposed
    }
    return this.generateUniqueId(baseId, index + 1, delimiter)
  }

  addChildFieldAfter(fieldToAddAfter: Field, newFieldType: AddableFieldType) {
    this.doEdit(() => {
      const formDraftJson = this.formDraft
      const parentField = formDraftJson.content.find(f => f.children?.some(c => c.id === fieldToAddAfter.id))
      const childArray = parentField ? parentField.children : formDraftJson.content
      const fieldToAddAfterOnForm = formDraftJson.content.find(f => f.id === fieldToAddAfter.id)
      const indexOfNewChild = fieldToAddAfterOnForm && childArray?.indexOf(fieldToAddAfterOnForm) ? childArray?.indexOf(fieldToAddAfterOnForm) + 1 : 0

      const newId = parentField?.fieldType === "growingFieldsetChild"
        ? this.generateUniqueId(`${parentField.id}.${newFieldType}`, 0, "_")
        : this.generateUniqueId(newFieldType, 0)
      const newChild = this.createNewField(newFieldType, newId)

      const parent = parentField ? formDraftJson.content.find(f => f.id === parentField.id) : formDraftJson.content
      if (_.isArray(parent)) {
        parent.splice(indexOfNewChild, 0, newChild)
      } else {
        parent?.children?.splice(indexOfNewChild, 0, newChild)
      }
      return newChild
    })
  }

  static createEmptyOption() {
    return { value: "", label: { fi: "", sv: "" } }
  }

  appendOption(radioButtonField: { id: string }) {
    this.doEdit(() => {
      const fieldInForm = this.formDraft.content.find(f => f.id === radioButtonField.id)
      fieldInForm?.options?.push(FormEditorController.createEmptyOption())
    })
  }

  removeOption(radioButtonField: { id: string }, optionToRemove: Option) {
    this.doEdit(() => {
      const fieldInForm = this.formDraft.content.find(f => f.id === radioButtonField.id)
      if (fieldInForm?.options) {
        _.remove(fieldInForm?.options, optionToRemove)
      }
    })
  }
}
