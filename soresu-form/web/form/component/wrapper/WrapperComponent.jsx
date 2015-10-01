import React from 'react'
import ComponentFactory from '../../ComponentFactory'
import ThemeWrapper from './ThemeWrapper.jsx'
import Fieldset from './Fieldset.jsx'
import GrowingFieldset from './GrowingFieldset.jsx'
import GrowingFieldsetChild from './GrowingFieldsetChild.jsx'

export default class WrapperComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "theme": ThemeWrapper,
      "fieldset": Fieldset,
      "growingFieldset": GrowingFieldset,
      "growingFieldsetChild": GrowingFieldsetChild
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    const field = this.props.field
    const displayAs = field.displayAs
    const controller = this.props.controller

    if (displayAs in controller.getCustomComponentTypeMapping()) {
      return controller.createCustomComponent(this.props)
    } else {
      return this.componentFactory.createComponent(this.props)
    }
  }
}
