import React from 'react'
import ComponentFactory from '../../ComponentFactory.js'
import ThemeWrapper from './../../component/wrapper/ThemeWrapper.jsx'
import FieldsetPreview from './FieldsetPreview.jsx'
import GrowingFieldsetPreview from './GrowingFieldsetPreview.jsx'
import GrowingFieldsetChildPreview from './GrowingFieldsetChildPreview.jsx'

export default class WrapperPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "theme": ThemeWrapper,
      "fieldset": FieldsetPreview,
      "growingFieldset": GrowingFieldsetPreview,
      "growingFieldsetChild": GrowingFieldsetChildPreview
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    const field = this.props.field
    const fieldType = field.fieldType
    const controller = this.props.controller

    if (fieldType in controller.getCustomPreviewComponentTypeMapping()) {
      return controller.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}