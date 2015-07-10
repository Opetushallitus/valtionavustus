import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import LocalizedString from './element/LocalizedString.jsx'

class BasicValue extends React.Component {
  render() {
    var value = "\u00a0" //&nbsp;
    if (this.props.value) {
      value = this.props.value
    }
    return (<span className="value" id={this.props.htmlId}>{value}</span>)
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
    return (<span className="value" id={this.props.htmlId}>{value}</span>)
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
      <div className={this.className()}>
        {this.label()}
        {preview}
      </div>
    )
  }

  className() {
    const classNames = ClassNames(this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  sizeClassName() {
    if (this.param("size") && !Number.isInteger(this.param("size"))) return this.param("size")
    else return undefined
  }

  label() {
    if( this.hideLabel()) return undefined
    else {
      return (<LocalizedString
                className="key"
                translations={this.props.field}
                translationKey="label"
                lang={this.props.lang} />)
    }
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
