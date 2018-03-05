import React, { Component } from 'react'
import Select from 'react-select';
import { Async } from 'react-select';
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import VirtualizedSelect from 'react-virtualized-select';
import HttpUtil from 'soresu-form/web/HttpUtil'

export default class AutocompleteCodeValue extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectValue: "",
      avustushaku: this.props.avustushaku,
      controller: this.props.controller,
      codeType: this.props.codeType,
      id: this.props.id,
      options: ""
    }
    this.setState = this.setState.bind(this)
    this.updateValue = this.updateValue.bind(this)
    this.getOptions = this.getOptions.bind(this)
  }

  componentDidMount() {
      this.setState({
        options: this.getOptions()
      })
    }

getOptions() {
  HttpUtil.get(`/api/v2/va-code-values/?value-type=${this.state.codeType}&year=2018`)
    .then(response => {
      this.setState({options: response  })}
    )
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
    return (
      <VirtualizedSelect ref="codeValueSelect"
          id="codeValue"
					simpleValue
					clearable
          options={this.state.options}
					value={this.state.selectValue}
					onChange={this.updateValue}
					searchable
					labelKey="code-value"
					valueKey="code"
          placeholder="Valitse listasta"
          style={{ width: '97%' }}
          backspaceRemoves={true}
				/>

    );
  }
}
