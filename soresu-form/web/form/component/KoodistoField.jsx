import React from 'react'
import BasicTextField from './BasicTextField.jsx'

export default class KoodistoField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = "text"
  }

  baseClassName() {
    return "soresu-text-field"
  }

  render() {
    console.log('I am a KoodistoField that does not do much yet.')
    return super.render()
  }
}
