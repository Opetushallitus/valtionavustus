import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import LocalizedString from './LocalizedString.jsx'
import Translator from './Translator.js'
import FormElementError from './FormElementError.jsx'

class BasicFieldComponent extends React.Component {
  constructor(props) {
    super(props)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    this.props.model.componentDidMount(this.props.field, this.props.value)
  }

  label(className) {
    if (this.hideLabel() || !this.props.field.label) return undefined
    else {
      return (<label htmlFor={this.props.htmlId}
                     className={this.labelClassName(className)}>
                <LocalizedString
                  translations={this.props.field}
                  translationKey="label"
                  lang={this.props.lang} />
              </label>)
    }
  }

  labelClassName(className) {
    const classNames = ClassNames(className, { required: this.props.field.required, disabled: this.props.disabled })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  hideLabel() {
    return this.props.renderingParameters && this.props.renderingParameters.hideLabels === true
  }

  param(param, defaultValue) {
    if (!this.props.field.params) return defaultValue
    if (this.props.field.params[param] !== undefined) return this.props.field.params[param]
    return defaultValue
  }
}

class BasicTextComponent extends BasicFieldComponent {
  sizeClassName() {
    if (this.param("size") && !Number.isInteger(this.param("size"))) return this.param("size")
    else return undefined
  }

  resolveClassName() {
    const classNames = ClassNames({ error: !_.isEmpty(this.props.validationErrors)}, this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}

class BasicTextField extends BasicTextComponent {
  constructor(props) {
    super(props)
    this.fieldtype = "text"
  }

  render() {
    const sizeNumber = Number.isInteger(this.param("size")) ? this.param("size") : undefined
    const classStr = this.resolveClassName()
    const field = this.props.field
    return (<div className={classStr}>
              {this.label(classStr)}
              <input
                type={this.fieldtype}
                id={this.props.htmlId}
                name={this.props.htmlId}
                required={field.required}
                size={sizeNumber}
                maxLength={this.param("maxlength")}
                model={this.props.model}
                value={this.props.value}
                className={classStr}
                disabled={this.props.disabled}
                onChange={e => this.props.onChange(this.props.field, e.target.value)}
              />
            </div>)
  }
}

class EmailTextField extends BasicTextField {
  constructor(props) {
    super(props)
    this.fieldtype = "email"
  }
}

class BasicTextArea extends BasicTextComponent {
  render() {
    const field = this.props.field
    const length = _.isUndefined(this.props.value) ? 0 : this.props.value.length
    const lengthLeft = this.param("maxlength") - length
    const classStr = this.resolveClassName()
    return (<div>
              {this.label(classStr)}
              <textarea
                id={this.props.htmlId}
                name={this.props.htmlId}
                required={field.required}
                maxLength={this.param("maxlength")}
                model={this.props.model}
                value={this.props.value}
                className={classStr}
                disabled={this.props.disabled}
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
                  disabled={this.props.disabled}>
            {label}
          </option>
        )
      }
    }
    return (<div>
              {this.label()}
              <select id={this.props.htmlId}
                      name={this.props.htmlId}
                      required={field.required}
                      disabled={this.props.disabled}
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
                                 disabled={this.props.disabled}
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
              {this.label()}
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
    var input = <span>Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      input = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return input
  }
}
