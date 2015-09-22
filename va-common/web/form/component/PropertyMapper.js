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
    return {
      htmlId: props.htmlId,
      fieldType: props.fieldType,
      translations: _.extend(props.translations, { label: field.label, helpText: field.helpText, text: field.text }),
      translationKey: "label",
      lang: props.lang
    }
  }
}

class FieldPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = CommonPropertyMapper.map(props)
    const field = props.field
    return _.extend(commonProps, {
      controller: props.controller,
      field: field,
      disabled: props.disabled,
      renderingParameters: props.renderingParameters
    })
  }
}

class FieldOnChangePropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = FieldPropertyMapper.map(props)
    const field = props.field
    const onChange = e => { props.onChange(field, e.target.value) }
    return _.extend(commonProps, {
      value: props.value,
      onChange: onChange,
      required: field.required,
      hasError: !_.isEmpty(props.validationErrors)
    })
  }
}

export class TextFieldPropertyMapper extends CommonPropertyMapper {
  static map(props) {
    const field = props.field
    const commonProps = FieldOnChangePropertyMapper.map(props)
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
    const commonProps = FieldOnChangePropertyMapper.map(props)
    return _.extend(commonProps, {
      options: props.field.options
    })
  }
}

export class ButtonPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = FieldPropertyMapper.map(props)
    const controller = props.controller
    const onClick = (e) => { controller.componentOnChangeListener(props.field, "click"); e.preventDefault() }
    return _.extend(commonProps, {
      onClick: onClick
    })
  }
}

export class AttachmentFieldPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = FieldPropertyMapper.map(props)
    const controller = props.controller
    const downloadUrl = controller.createAttachmentDownloadUrl(props.state, props.field)
    const onDrop = (files) => { controller.uploadAttachment(props.field, files) }
    const onRemove = () => { controller.deleteAttachment(props.field) }
    return _.extend({
      required: props.field.required,
      attachments: props.attachments,
      attachmentUploadsInProgress: props.attachmentUploadsInProgress,
      downloadUrl: downloadUrl,
      onDrop: onDrop,
      onRemove: onRemove
    }, commonProps)
  }
}

export class InfoElementPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = CommonPropertyMapper.map(props)
    return _.extend(commonProps, {
      values: props.values
    })
  }
}

export class AccordionElementPropertyMapper extends DefaultPropertyMapper {
  static map(props) {
    const commonProps = InfoElementPropertyMapper.map(props)
    const field = props.field
    const initiallyOpen = DefaultPropertyMapper.param(field, "initiallyOpen", true)
    return _.extend(commonProps, {
      renderingParameters: { initiallyOpen: initiallyOpen }
    })
  }
}