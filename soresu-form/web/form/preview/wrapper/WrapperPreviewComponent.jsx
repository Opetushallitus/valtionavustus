import React from 'react'

import ComponentFactory from '../../ComponentFactory'
import ThemeWrapper from './../../component/wrapper/ThemeWrapper'
import FieldsetPreview from './FieldsetPreview'
import GrowingFieldsetPreview from './GrowingFieldsetPreview'
import GrowingFieldsetChildPreview from './GrowingFieldsetChildPreview'

export default class WrapperPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      theme: ThemeWrapper,
      fieldset: FieldsetPreview,
      growingFieldset: GrowingFieldsetPreview,
      growingFieldsetChild: GrowingFieldsetChildPreview,
    }
    this.componentFactory = new ComponentFactory({
      fieldTypeMapping: fieldTypeMapping,
      fieldPropertyMapperMapping: {},
    })
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
