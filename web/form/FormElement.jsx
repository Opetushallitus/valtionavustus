import React from 'react'
import LocalizedString from './LocalizedString.jsx'
import Translator from './Translator.js'
import FormElementError from './FormElementError.jsx'
import _ from 'lodash'

class BasicFieldComponent extends React.Component {
  constructor(props) {
    super(props)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.props.model.componentDidMount(this.props.field, this.props.value)
  }

  param(param, defaultValue) {
    if (!this.props.field.params) return defaultValue
    if (this.props.field.params[param] !== undefined) return this.props.field.params[param]
    return defaultValue
  }
}

class BasicTextField extends BasicFieldComponent {
  render() {
    const field = this.props.field
    return (<div>
              {this.props.label}
              <input
                type="text"
                id={this.props.htmlId}
                name={this.props.htmlId}
                required={field.required}
                size={this.param("size", this.param("maxlength",80))}
                maxLength={this.param("maxlength")}
                model={this.props.model}
                value={this.props.value}
                className={!_.isEmpty(this.props.validationErrors) ? "error" : ""}
                disabled={this.props.disabled ? "disabled" : ""}
                onChange={e => this.props.onChange(this.props.field, e.target.value)}
              />
            </div>)
  }
}

class EmailTextField extends BasicFieldComponent {
  render() {
    const field = this.props.field
    return (<div>
              {this.props.label}
              <input
              type="email"
              id={this.props.htmlId}
              name={this.props.htmlId}
              required={field.required}
              size={this.param("size", this.param("maxlength",80))}
              maxLength={this.param("maxlength")}
              model={this.props.model}
              value={this.props.value}
              className={!_.isEmpty(this.props.validationErrors) ? "error" : ""}
              disabled={this.props.disabled ? "disabled" : ""}
              onChange={e => this.props.onChange(this.props.field, e.target.value)}
              />
            </div>)
  }
}

class BasicTextArea extends BasicFieldComponent {
  render() {
    const field = this.props.field
    const lengthLeft = this.param("maxlength") - this.props.value.length
    return (<div>
              {this.props.label}
              <textarea
                id={this.props.htmlId}
                name={this.props.htmlId}
                required={field.required}
                maxLength={this.param("maxlength")}
                model={this.props.model}
                value={this.props.value}
                className={!_.isEmpty(this.props.validationErrors) ? "error" : ""}
                disabled={this.props.disabled ? "disabled" : ""}
                onChange={e => this.props.onChange(this.props.field, e.target.value)} />
              <div className="length-left-spacer"></div>
              <div id={this.props.htmlId + ".length"} className="length-left">
                {lengthLeft + " "}
                <LocalizedString translations={this.props.translations.form} translationKey="lengthleft" lang={this.props.lang}/>
              </div>
            </div>)
  }
}

class Dropdown extends BasicFieldComponent {
  render() {
    const field = this.props.field
    const options = [];
    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", this.props.lang, field.options[i].value)
        options.push(
          <option key={this.props.htmlId + "." + field.options[i].value}
                  value={field.options[i].value}
                  disabled={this.props.disabled ? "disabled" : ""}>
            {label}
          </option>
        )
      }
    }
    return (<div>
              {this.props.label}
              <select id={this.props.htmlId}
                      name={this.props.htmlId}
                      required={field.required}
                      className={!_.isEmpty(this.props.validationErrors) ? "error" : ""}
                      disabled={this.props.disabled ? "disabled" : ""}
                      model={this.props.model}
                      onChange={e => this.props.onChange(this.props.field, e.target.value)}
                      value={this.props.value}>
                {options}
              </select>
            </div>)
  }
}

class RadioButton extends BasicFieldComponent {
  render() {
    const field = this.props.field
    const radiobuttons = [];

    if (field.options) {
      for (var i=0; i < field.options.length; i++) {
        const label = new Translator(field.options[i]).translate("label", this.props.lang, field.options[i].value)
        radiobuttons.push(<input type="radio" id={this.props.htmlId + ".radio." + i}
                                 key={this.props.htmlId + "." + field.options[i].value}
                                 name={this.props.htmlId}
                                 required={field.required}
                                 className={!_.isEmpty(this.props.validationErrors) ? "error" : ""}
                                 disabled={this.props.disabled ? "disabled" : ""}
                                 value={field.options[i].value}
                                 onChange={e => this.props.onChange(this.props.field, e.target.value)}
                                 checked={field.options[i].value === this.props.value ? true: null} />)
        radiobuttons.push(
          <label key={this.props.htmlId + "." + field.options[i].value + ".label"}
                 htmlFor={this.props.htmlId + ".radio." + i}>
            {label}
          </label>
        )
      }
    }
    return (<div>
              {this.props.label}
              {radiobuttons}
            </div>)
  }
}

export default class FormElement extends React.Component {

  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicTextField,
      "textArea": BasicTextArea,
      "emailField": EmailTextField,
      "dropdown": Dropdown,
      "radioButton": RadioButton
    }
  }

  render() {
    const field = this.props.field
    const displayAs = field.displayAs
    const label = this.props.renderingParameters && this.props.renderingParameters.hideLabels === true ?
      "" :
      <label htmlFor={this.props.htmlId} className={field.required ? "required" : ""}><LocalizedString  translations={field} translationKey="label" lang={this.props.lang} /></label>
    const errorElement = <FormElementError fieldId={this.props.htmlId} validationErrors={this.props.validationErrors} translations={this.props.translations} lang={this.props.lang}/>

    const componentProps =_.assign(this.props, { label: label }, { errorElement: errorElement })
    var input = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      input = React.createElement(this.fieldTypeMapping[displayAs], componentProps)
    }
    return input
  }
}
