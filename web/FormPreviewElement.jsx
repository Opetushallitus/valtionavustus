import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class BasicValueField extends React.Component {
  render() {
    var field = this.props.field
    return (<span id={field.id}>{this.props.value}</span>)
  }
}

class OptionsValueField extends React.Component {
  render() {
    var field = this.props.field
    var value = ""
    if(field.options) {
      for (var i=0; i < field.options.length; i++) {
        if(field.options[i].value === this.props.value) {
          value = <LocalizedString data={field.options[i].label} lang={this.props.lang} />
        }
      }
    }
    return (<span id={field.id}>{value}</span>)
  }
}

export default class FormPreviewElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicValueField,
      "textArea": BasicValueField,
      "dropdown": OptionsValueField,
      "radioButton": OptionsValueField
    }
  }

  render() {
    var field = this.props.field;
    var displayAs = field.displayAs
    var preview = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      preview = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }

    return (
      <div>
        <label><LocalizedString data={field.label} lang={this.props.lang} />: </label>
        {preview}
      </div>
    )
  }
}
