import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import {TextFieldEdit,TextAreaEdit,MultipleChoiceEdit} from './EditComponent.jsx'
import {TextFieldPropertyMapper} from '../component/PropertyMapper.js'

export default class FormEditComponent extends React.Component {

  static fieldTypeMapping(){
    return {
      "textField": TextFieldEdit,
      "textArea": TextAreaEdit,
      "radioButton": MultipleChoiceEdit,
      "checkboxButton": MultipleChoiceEdit,
      "dropdown": MultipleChoiceEdit
    }
  }

  constructor(props) {
    super(props)
    const fieldPropertyMapping = {
      "textField": TextFieldEditPropertyMapper,
      "textArea": TextFieldEditPropertyMapper
    }

    this.componentFactory = new ComponentFactory({ fieldTypeMapping: FormEditComponent.fieldTypeMapping(), fieldPropertyMapperMapping: fieldPropertyMapping})
  }

  render() {
    const fieldType = this.props.fieldType
    const controller = this.props.controller

    if (fieldType in controller.getCustomPreviewComponentTypeMapping()) {
      return controller.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}

class EditPropertyMapperExtender{
  static extendedMap(baseMapper, props) {
    const baseProps = baseMapper.map(props)
    return _.extend(baseProps, {
      formEditorController: props.formEditorController
    })
  }
}

class TextFieldEditPropertyMapper extends TextFieldPropertyMapper {
  static map(props) {
    return EditPropertyMapperExtender.extendedMap(TextFieldPropertyMapper, props)
  }
}
