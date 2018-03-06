import React, { Component } from 'react'
import Select from 'react-select';
import { Async } from 'react-select';
import BasicTextField from 'soresu-form/web/form/component/BasicTextField.jsx'
import VirtualizedSelect from 'react-virtualized-select';
import HttpUtil from 'soresu-form/web/HttpUtil'


class codeLabels extends React.Component {
    render() {
      return
				 <div>{this.props.state.option.code + " " + this.props.state.option["code-value"]} </div>}
  }

export default class AutocompleteCodeValue extends Component {
  constructor(props) {
    super(props)
    this.state = {
      selectValue: "",
      avustushaku: this.props.avustushaku,
      controller: this.props.controller,
      codeType: this.props.codeType,
      id: this.props.id,
      options: []
    }
    this.setState = this.setState.bind(this)
    this.updateValue = this.updateValue.bind(this)
    this.getOptions = this.getOptions.bind(this)
    this.NameOptionRenderer = this.NameOptionRenderer.bind(this)
    this.codeValueRenderer = this.codeValueRenderer.bind(this)
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

updateValue (option) {
  this.setState({
    selectValue: option
  })

  if (this.state.codeType == "project") {
    this.state.avustushaku["project_id"] = option.id
    console.log(option.id)
  } else if (this.state.codeType == "operation"){
     this.state.avustushaku["operation_id"] = option.id
   }else if (this.state.codeType == "operational-unit"){
   this.state.avustushaku["operational_unit_id"] = option.id
 }
}

NameOptionRenderer({key, labelKey, option, selectValue, style, valueArray, valueKey }) {
  return (
    <div
      id="codeValue"
      className="Select-input"
      style={{ width: '97%' }}
      key={key}
      onClick={() => this.updateValue(option)}
    >
      {option.code + " " + option["code-value"]}
    </div>
  )
}

codeValueRenderer(option){
  return (
    <div>{option.code + " " + option["code-value"]}</div>
  )

}


  render() {
    return (
      <VirtualizedSelect ref="codeValueSelect"
          labelKey='code'
          placeholder="Valitse listasta"
          style={{ width: '97%' }}
          backspaceRemoves={true}
          options={this.state.options}
          onChange={this.updateValue}
          optionRenderer={this.NameOptionRenderer}
          valueKey='code'
          value={this.state.selectValue}
          valueRenderer={this.codeValueRenderer}
				/>

    );
  }
}
