import BasicTextField from "./BasicTextField";

export default class FinnishBusinessIdTextField extends BasicTextField {
  constructor(props) {
    super(props);
    this.inputType = "text";
  }

  baseClassName() {
    return "soresu-finnish-business-id-field";
  }
}
