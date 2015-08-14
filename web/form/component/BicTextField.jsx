import BasicTextField from './BasicTextField.jsx'

export default class BicTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = "text"
  }
}