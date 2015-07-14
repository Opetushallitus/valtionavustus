import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicValue from './BasicValue.jsx'
import OptionValue from './OptionValue.jsx'

export default class FormPreviewElement extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicValue,
      "textArea": BasicValue,
      "emailField": BasicValue,
      "dropdown": OptionValue,
      "radioButton": OptionValue
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    return this.componentFactory.createComponent(this.props)
  }
}
