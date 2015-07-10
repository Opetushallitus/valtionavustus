import React from 'react'
import BasicTextField from './BasicTextField.jsx'

export default class EmailTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.fieldtype = "email"
  }
}