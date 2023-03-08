import { Field } from './types'

export function addFieldsToHakemusJson(jsonString: string, fields: Field[]) {
  const json = JSON.parse(jsonString)
  const content = json.content

  const fieldsWithIdAndLabel = fields.map(({ fieldId, type }) => ({
    fieldType: type,
    fieldId,
    fieldLabel: `fieldLabel-${fieldId}`,
  }))

  const fieldsJson = fieldsWithIdAndLabel.map(({ fieldType, fieldId, fieldLabel }) =>
    fieldJson(fieldType, fieldId, fieldLabel)
  )
  return JSON.stringify(Object.assign({}, json, { content: content.concat(fieldsJson) }))
}

function fieldJson(type: string, id: string, label: string) {
  return {
    fieldClass: 'wrapperElement',
    id: id + 'wrapper',
    fieldType: 'theme',
    children: [
      {
        label: {
          fi: label + 'fi',
          sv: label + 'sv',
        },
        fieldClass: 'formField',
        helpText: {
          fi: 'helpText fi',
          sv: 'helpText sv',
        },
        id: id,
        params: {
          size: 'small',
          maxlength: 1000,
        },
        required: true,
        fieldType: type,
      },
    ],
  }
}
