import React from 'react'
import ComponentFactory from '../../ComponentFactory.js'
import ThemeWrapper from './../../element/wrapper/ThemeWrapper.jsx'
import FieldsetPreview from './FieldsetPreview.jsx'
import GrowingFieldsetPreview from './GrowingFieldsetPreview.jsx'
import GrowingFieldsetChildPreview from './GrowingFieldsetChildPreview.jsx'

export default class WrapperPreviewElement extends React.Component {
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
    const displayAs = field.displayAs
    const model = this.props.model

    if (displayAs in model.getCustomPreviewComponentTypeMapping()) {
      return model.createCustomPreviewComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}