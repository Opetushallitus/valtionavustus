import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import {TextFieldEdit} from './EditComponent.jsx'
import { TextFieldPropertyMapper} from '../component/PropertyMapper.js'

export default class FormEditComponent extends React.Component {

  static fieldTypeMapping(){
    return {
      "textField": TextFieldEdit,
      "textArea": TextFieldEdit
    }
  }

  constructor(props) {
    super(props)
    const fieldPropertyMapping = {
      "textField": TextFieldPropertyMapper,
      "textArea": TextFieldPropertyMapper
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
