import React from 'react'
import ComponentFactory from '../ComponentFactory.js'
import BasicValue from './BasicValue.jsx'
import MoneyValue from './MoneyValue.jsx'
import OptionValue from './OptionValue.jsx'

export default class FormPreviewComponent extends React.Component {
  constructor(props) {
    super(props)
    const fieldTypeMapping = {
      "textField": BasicValue,
      "textArea": BasicValue,
      "emailField": BasicValue,
      "moneyField": MoneyValue,
      "dropdown": OptionValue,
      "radioButton": OptionValue
    }
    this.componentFactory = new ComponentFactory(fieldTypeMapping)
  }

  render() {
    return this.componentFactory.createComponent(this.props)
  }
}
