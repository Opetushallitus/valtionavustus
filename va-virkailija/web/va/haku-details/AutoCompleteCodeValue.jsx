import React from 'react';
import Select from 'react-select';
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'

export default class AutocompleteCodeValue extends BasicTextField {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    this.state = {
      selectedOption: ""
    }
    this.setState = this.setState.bind(this)
  }


  // handleChange(selectedOption) {
  //   const inputted = event.target.value
  //   this.setState({selectedOption: inputted})
  //   // tää on undefined console.log(this.state.selectedOption.value)
  //   console.log(`inputted: ${inputted}`);
  //   console.log(`Selected: ${this.state.selectedOption}`);
  //
  // }


 handleChange(selectedOption) {
  this.setState({ selectedOption });
  console.log(`Selected: ${selectedOption.label}`);
}

  updateValue (selectedOption) {
  console.log(`Selected: ${selectedOption.label}`);
}


  render() {
    const value = this.state.selectedOption && this.state.selectedOption.value;
    return (
        <Select
         id="ansku"
         name="form-field-name"
         value={value}
         onChange={this.handleChange}
         placeholder=""
         options={[
           { value: 'firstvalue', label: 'firstlabel' },
           { value: 'secondvalue', label: 'secondlabel' },
         ]}
         style={{ width: '97%' }}/>
    );
  }
}
