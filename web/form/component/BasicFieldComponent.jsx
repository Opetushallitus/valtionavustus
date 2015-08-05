import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import LocalizedString from './LocalizedString.jsx'

export default class BasicFieldComponent extends React.Component {
  constructor(props) {
    super(props)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    if (this.props.field) {
      this.props.controller.componentDidMount(this.props.field, this.props.value)
    }
  }

  static checkValueOnBlur(field, htmlId, oldValue, onChange, controller) {
    return function() {
      const element = document.getElementById(htmlId)
      if(element) {
        const newValue = element.value
        if(oldValue !== newValue) {
          onChange(field, newValue)
        }
        else {
          controller.initFieldValidation(field, newValue, true)
        }
      }
    }
  }

  label(className) {
    const translationKey = this.props.translationKey
    if (this.hideLabel() || !this.props.translations[translationKey]) return undefined
    else {
      return (<label htmlFor={this.props.htmlId}
                     className={this.labelClassName(className)}>
                <LocalizedString translations={this.props.translations}
                                 translationKey={translationKey}
                                 lang={this.props.lang} />
              </label>)
    }
  }

  labelClassName(className) {
    const classNames = ClassNames(className, { required: this.props.required, disabled: this.props.disabled })
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