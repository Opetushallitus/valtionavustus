import React, { Component } from 'react'
import Select from 'react-select'

export default class AutocompleteCodeValue extends Component {
  constructor(props) {
    super(props)
    this.updateValue = this.updateValue.bind(this)
  }

  updateValue (option) {
    if (option == null) {
      this.props.controller.onChangeListener(
        this.props.avustushaku, {id: this.props.id}, null)
      this.props.avustushaku[this.props.codeType] = null
    } else {
      this.props.controller.onChangeListener(
        this.props.avustushaku, {id: this.props.id}, option.id)
      this.props.avustushaku[this.props.codeType] = option.id
    }
  }

  getOptionValue(option) {
    return `${option.code} ${option["code-value"]}`
  }

  render() {
    return (
      <Select
        labelKey='code'
        placeholder="Valitse listasta"
        backspaceRemoves={true}
        options={this.props.codeOptions}
        onChange={this.updateValue}
        getOptionValue={this.getOptionValue}
        value={this.props.selectedValue}
        backspaceRemovesValue={true}
        components={{ Option, SingleValue, NoOptionsMessage }}
      />
    )
  }
}

function Option({data, selectOption, style}) {
  const onChange = () => selectOption(data)

  return (
    <div
      className="Select-input name-option-renderer code-value-renderer"
      style={style}
      onClick={onChange}
      data-test-id={data.code}>
      <span>{data.code}</span>
      <span>{data["code-value"]}</span>
    </div>
  )
}

function SingleValue({ data }) {
  return (
    <div className="code-value-renderer">
      <span>{data.code}</span>
      <span>{data["code-value"]}</span>
    </div>
  )
}

function NoOptionsMessage(_props) {
  return (
    <span data-test-id="code-value-dropdown__no-options">
      Ei hakutuloksia
    </span>
  )
}
