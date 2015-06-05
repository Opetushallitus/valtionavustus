import React from 'react'
import LocalizedString from './LocalizedString.jsx'
import FormElementError from './FormElementError.jsx'

class BasicFieldComponent extends React.Component {

  handleChange(event) {
    var value = event.target.value
    var validationErrors = []
    if(this.props.required && !value) {
      validationErrors = [{error: "required"}]
    }
    this.props.model.setFieldValue(this.props.name, value, validationErrors)
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
              required={field.required}
              size={this.param("size", this.param("maxlength",80))}
              maxLength={this.param("maxlength")}
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
              required={field.required}
              rows={this.param("rows", 10)}
              cols={this.param("cols", 120)}
              maxLength={this.param("maxlength")}
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
        options.push(<option key={field.id + "." + field.options[i].value} value={field.options[i].value}>
                      {field.options[i].label ? field.options[i].label[this.props.lang] : field.options[i].value}
                     </option>)
      }
    }
    return (<select id={field.id} name={field.id} required={field.required} model={this.props.model} onChange={this.handleChange} value={this.props.value}>
              {options}
            </select>)
  }
}

class RadioButton extends BasicFieldComponent {
  render() {
    var field = this.props.field
    var radiobuttons = [];

    if(field.options) {
      for (var i=0; i < field.options.length; i++) {
        var label = field.options[i].label ? <label htmlFor={field.id + ".radio." + i}><LocalizedString key={field.id + "." + field.options[i].value + ".label"} data={field.options[i].label} lang={this.props.lang} /></label> : field.options[i].value
        radiobuttons.push(<input {...this.props} type="radio" id={field.id + ".radio." + i} key={field.id + "." + field.options[i].value} name={field.id} required={field.required} value={field.options[i].value} onChange={this.handleChange} checked={field.options[i].value === this.props.value ? true: null}/>)
        radiobuttons.push(label)
      }
    }
    return (<div className="pure-radio">{radiobuttons}</div>)
  }
}

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "dropdown": Dropdown,
      "radioButton": RadioButton
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
        <label htmlFor={field.id} className={field.required ? "required" : ""}><LocalizedString data={field.label} lang={this.props.lang} /></label>
        <FormElementError fieldId={field.id} validationErrors={this.props.validationErrors} translations={this.props.translations} lang={this.props.lang}/>
        {input}
      </div>
    )
  }
}
