import BasicTextField from "./BasicTextField";

export default class IbanTextField extends BasicTextField {
  constructor(props) {
    super(props);
    this.inputType = "text";
  }
}
