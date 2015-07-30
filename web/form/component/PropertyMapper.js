import _ from 'lodash'

import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class DefaultPropertyMapper {
  static map(props) {
    return props
  }

  static param(field, param, defaultValue) {
    if (!field.params) return defaultValue
    if (field.params[param] !== undefined) return field.params[param]
    return defaultValue
  }
}

export class TextFieldPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const field = props.field
    const onChange = e => { props.onChange(field, e.target.value) }
    const onBlur = BasicFieldComponent.checkValueOnBlur(field, props.htmlId, props.value, props.onChange, props.controller)
    return {
      htmlId: props.htmlId,
      value: props.value,
      controller: props.controller,
      field: field,
      fieldType: props.fieldType,
      onChange: onChange,
      onBlur: onBlur,
      size: DefaultPropertyMapper.param(field, "size"),
      maxLength: DefaultPropertyMapper.param(field, "maxlength"),
      renderingParameters: props.renderingParameters,
      disabled: props.disabled,
      required: field.required,
      translations: { label: field.label },
      translationKey: "label",
      hasError: !_.isEmpty(props.validationErrors),
      lang: props.lang
    }
  }
}