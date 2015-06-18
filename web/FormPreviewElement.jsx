import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class BasicValue extends React.Component {
  render() {
    var value = "\u00a0" //&nbsp;
    const field = this.props.field
    if (this.props.value) {
      value = this.props.value
    }
    return (<span id={field.id}>{value}</span>)
  }
}

class OptionsValue extends React.Component {
  render() {
    const field = this.props.field
    const lang = this.props.lang
    var value = "\u00a0" //&nbsp;
    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        if (field.options[i].value === this.props.value) {
          const val = field.options[i]
          value = <LocalizedString translations={val} translationKey="label" lang={lang} />
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
      "textField": BasicValue,
      "textArea": BasicValue,
      "emailField": BasicValue,
      "dropdown": OptionsValue,
      "radioButton": OptionsValue
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs
    var preview = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      preview = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }

    return (
      <div>
        <label><LocalizedString translations={field} translationKey="label" lang={this.props.lang} /></label>
        {preview}
      </div>
    )
  }
}
