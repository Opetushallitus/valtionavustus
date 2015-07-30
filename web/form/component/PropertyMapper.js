import _ from 'lodash'

import BasicFieldComponent from './BasicFieldComponent.jsx'

export class DefaultPropertyMapper {
  static map(props) {
    return props
  }

  static param(field, param, defaultValue) {
    if (!field.params) return defaultValue
    if (field.params[param] !== undefined) return field.params[param]
    return defaultValue
  }
}

class CommonPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const field = props.field
    const onChange = e => { props.onChange(field, e.target.value) }
    return {
      htmlId: props.htmlId,
      value: props.value,
      controller: props.controller,
      field: field,
      fieldType: props.fieldType,
      onChange: onChange,
      renderingParameters: props.renderingParameters,
      disabled: props.disabled,
      required: field.required,
      translations: _.extend(props.translations, { label: field.label }),
      translationKey: "label",
      hasError: !_.isEmpty(props.validationErrors),
      lang: props.lang
    }
  }
}

export class TextFieldPropertyMapper extends CommonPropertyMapper {
  static map(props) {
    const field = props.field
    const commonProps = CommonPropertyMapper.map(props)
    const onBlur = BasicFieldComponent.checkValueOnBlur(field, props.htmlId, props.value, props.onChange, props.controller)
    return _.extend(commonProps, {
      onBlur: onBlur,
      size: DefaultPropertyMapper.param(field, "size"),
      maxLength: DefaultPropertyMapper.param(field, "maxlength")
    })
  }
}

export class OptionFieldPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = CommonPropertyMapper.map(props)
    return _.extend(commonProps, {
      options: props.field.options
    })
  }
}