import React from 'react'
import ThemeWrapperElement from './element/wrapper/ThemeWrapperElement.jsx'
import FieldsetElement from './element/wrapper/FieldsetElement.jsx'
import GrowingFieldsetElement from './element/wrapper/GrowingFieldsetElement.jsx'
import GrowingFieldsetChildElement from './element/wrapper/GrowingFieldsetChildElement.jsx'

export default class WrapperElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement,
      "fieldset": FieldsetElement,
      "growingFieldset": GrowingFieldsetElement,
      "growingFieldsetChild": GrowingFieldsetChildElement
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
