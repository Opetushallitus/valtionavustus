import React from 'react'
import BasicTextField from './BasicTextField.jsx'

export default class BusinessIdTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = "text"
  }

  baseClassName() {
    return "soresu-business-id-field"
  }
}
