import React, { Component } from 'react'
import Select from 'react-select';
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import VirtualizedSelect from 'react-virtualized-select';

export default class AutocompleteCodeValue extends Component {
  constructor(props) {
    super(props)
    // this.handleChange = this.handleChange.bind(this)
    this.state = {
      selectValue: "",
      selectedOption: "",
      avustushaku: this.props.avustushaku,
      operationalUnit: this.props.avustushaku.content["operational-unit"],
      project: this.props.avustushaku.content["project"],
      operation: this.props.avustushaku.content["operation"],
      controller: this.props.controller,
      codeType: this.props.codeType,
      id: this.props.id
    }
    this.setState = this.setState.bind(this)
    this.updateValue = this.updateValue.bind(this)
    // this.onChangeListener = this.onChangeListener.bind(this)

  }

updateValue (newValue) {
  this.setState({
    selectValue: newValue,
    operationalUnit: newValue
  });
  this.props.controller.onChangeListener(this.props.avustushaku, {
    id: this.state.id
  }, newValue);

}


  render() {

  var codeValues = { operational: [{ name: '1144'},
    { name: '2223'}], project: [{ name: '9999'},
     { name: '8888'}], operation: [{ name: '5555'},
      { name: '4444'}]}

  const codeType = this.state.codeType

    return (
      <VirtualizedSelect ref="codeValueSelect"
          id="codeValue"
          options={codeValues[codeType]}
					simpleValue
					clearable
					value={this.state.selectValue}
					onChange={this.updateValue}
					searchable
					labelKey="name"
					valueKey="name"
          placeholder="Valitse listasta"
          style={{ width: '97%' }}
				/>

    );
  }
}
