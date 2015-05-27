import React from 'react'
import LocalizedString from './LocalizedString.jsx'

class BasicFieldComponent extends React.Component {

  handleChange(event) {
    this.props.model.setFieldValue(this.props.id, event.target.value)
  }

  param(param, defaultValue) {
    if(!this.props.field.params) return defaultValue
    if(this.props.field.params[param] !== undefined) return this.props.field.params[param]
    return defaultValue
  }

}

class BasicTextField extends BasicFieldComponent {
  render() {
    var field = this.props.field
    return (<input
              type="text"
              id={field.id}
              name={field.id}
              size={this.param("size", this.param("maxlength", 80))}
              maxLength={this.param("maxlength", 80)}
              model={this.props.model}
              value={this.props.value}
              onChange={this.handleChange}
            />)
  }
}

class BasicTextArea extends BasicFieldComponent {
  render() {
    var field = this.props.field
    return (<textarea
              id={field.id}
              name={field.id}
              rows={this.param("rows", 10)}
              cols={this.param("cols", 120)}
              maxLength={this.param("maxlength", 2000)}
              model={this.props.model}
              value={this.props.value}
              onChange={this.handleChange}
            />)
  }
}

class Dropdown extends BasicFieldComponent {
  render() {
    var field = this.props.field
    var options = [];
    if(field.options) {
      for (var i=0; i < field.options.length; i++) {
        var label = field.options[i].label ? <LocalizedString data={field.options[i].label} lang={this.props.lang} /> : field.options[i].value
        if(field.options[i].value === this.props.value) {
          options.push(<option value={field.options[i].value} selected>{label}</option>)
        }
        else {
          options.push(<option value={field.options[i].value}>{label}</option>)
        }
      }
    }
    return (<select id={field.id} name={field.id} model={this.props.model} onChange={this.handleChange}>
              {options}
            </select>)
  }
}

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "dropdown": Dropdown
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
