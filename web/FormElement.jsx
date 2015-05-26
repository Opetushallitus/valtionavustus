import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class BasicTextField extends React.Component {

  handleChange(event) {
    this.props.model.setFieldValue(this.props.id, event.target.value)
  }

  render() {
    var field = this.props.field
    var value = this.props.value
    return (<input id={field.id} type="text" name={field.id} model={this.props.model} value={value} onChange={this.handleChange} />)
  }
}

class BasicTextArea extends React.Component {

  handleChange(event) {
    this.props.model.setFieldValue(this.props.id, event.target.value)
  }

  render() {
    var field = this.props.field
    var value = this.props.value
    return (<textarea id={field.id} rows="4" cols="50" name={field.id} model={this.props.model} value={value} onChange={this.handleChange} />)
  }
}

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea
    }
  }

  render() {
    var field = this.props.field;
    var displayAs = field.displayAs
    var input = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      input = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }

    return (
      <div>
        <label><LocalizedString data={field.label} lang={this.props.lang} /></label>
        {input}
      </div>
    )
  }
}
