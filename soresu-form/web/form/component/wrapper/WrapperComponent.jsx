import React from 'react'
import ComponentFactory from '../../ComponentFactory'
import ThemeWrapper from './ThemeWrapper'
import Fieldset from './Fieldset'
import GrowingFieldset from './GrowingFieldset'
import GrowingFieldsetChild from './GrowingFieldsetChild'

export default class WrapperComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      theme: ThemeWrapper,
      fieldset: Fieldset,
      growingFieldset: GrowingFieldset,
      growingFieldsetChild: GrowingFieldsetChild,
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

    if (fieldType in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}
