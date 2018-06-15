import React, { Component } from 'react'
import 'react-select/less/default.less'
import VirtualizedSelect from 'react-virtualized-select'

export default class AutocompleteCodeValue extends Component {
  constructor(props) {
    super(props)
    this.updateValue = this.updateValue.bind(this)
    this.NameOptionRenderer = this.NameOptionRenderer.bind(this)
    this.codeValueRenderer = this.codeValueRenderer.bind(this)
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

  NameOptionRenderer({key, option}) {
    return (
      <div
        className="Select-input name-option-renderer"
        key={key}
        onClick={() => this.updateValue(option)}>
        <span>{option.code}</span>
        <span>{option["code-value"]}</span>
      </div>
    )
  }


  codeValueRenderer(option){
    return (
      <div className="code-value-renderer">
        {option.code} {option["code-value"]}
      </div>)
  }


  render() {
    return (
      <VirtualizedSelect
        id={this.props.codeType}
        labelKey='code'
        placeholder="Valitse listasta"
        backspaceRemoves={true}
        options={this.props.codeOptions}
        onChange={this.updateValue}
        optionRenderer={this.NameOptionRenderer}
        valueKey='code-value'
        value={this.props.selectedValue}
        valueRenderer={this.codeValueRenderer}
      />
    )
  }
}
