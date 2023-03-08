import BasicTextField from './BasicTextField'

export default class KoodistoField extends BasicTextField {
  constructor(props) {
    super(props)
    this.inputType = 'text'
  }

  baseClassName() {
    return 'soresu-text-field'
  }

  render() {
    return super.render()
  }
}
