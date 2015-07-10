import React from 'react'
import ThemeWrapper from './element/wrapper/ThemeWrapper.jsx'
import Fieldset from './element/wrapper/Fieldset.jsx'
import GrowingFieldset from './element/wrapper/GrowingFieldset.jsx'
import GrowingFieldsetChild from './element/wrapper/GrowingFieldsetChild.jsx'

export default class WrapperElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapper,
      "fieldset": Fieldset,
      "growingFieldset": GrowingFieldset,
      "growingFieldsetChild": GrowingFieldsetChild
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs
    const model = this.props.model

    var element = <span>WrapperElement: Unsupported field type {displayAs}</span>

    if (displayAs in model.getCustomComponentTypeMapping()) {
      element = model.createCustomComponent(this.props)
    } else if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return element
  }
}
