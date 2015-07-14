import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import LocalizedString from './../element/LocalizedString.jsx'
import BasicValue from './BasicValue.jsx'
import OptionValue from './OptionValue.jsx'

export default class FormPreviewElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "textField": BasicValue,
      "textArea": BasicValue,
      "emailField": BasicValue,
      "dropdown": OptionValue,
      "radioButton": OptionValue
    }
  }

  render() {
    const field = this.props.field;
    const displayAs = field.displayAs
    var preview = <span>{this.constructor.name} : Unsupported field type {displayAs}</span>

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
    const classNames = ClassNames("soresu-preview-element", this.sizeClassName())
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
                className="soresu-key"
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
