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
      this.setState({options: response})})}

updateValue (option) {
  this.setState({
    selectValue: option
  })

  this.props.controller.onChangeListener(this.state.avustushaku, {id: this.state.id}, option.id)
}

NameOptionRenderer({key, labelKey, option, selectValue, style, valueArray, valueKey }) {
  return (
    <div
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
          id={this.state.codeType}
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
