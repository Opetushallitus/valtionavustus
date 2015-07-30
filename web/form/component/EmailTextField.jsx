import React from 'react'
import BasicTextField from './BasicTextField.jsx'

export default class EmailTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = "email"
  }

  baseClassName() {
    return "soresu-email-field"
  }
}