import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

import LocalizedString from './LocalizedString'
import HelpTooltip from './HelpTooltip'
import FormController from 'soresu-form/web/form/FormController'
import { Field } from 'soresu-form/web/va/types'

export interface BasicFieldComponentProps {
  field: Field
  controller?: any
  value?: any
  renderingParameters?: any
  disabled?: boolean
  required?: boolean
  hasError?: boolean
  htmlId?: any
  lang: any
  translations: any
  translationKey: string
}

export default class BasicFieldComponent<T> extends React.Component<BasicFieldComponentProps & T> {
  constructor(props: BasicFieldComponentProps & T) {
    super(props)
    this.componentDidMount = this.componentDidMount.bind(this)
  }

  componentDidMount() {
    if (this.props.field && this.props.controller) {
      this.props.controller.componentDidMount(this.props.field, this.props.value)
    }
  }

  static checkValueOnBlur(
    field: Field,
    htmlId: string,
    oldValue: string,
    onChange: any,
    controller: FormController<any>
  ) {
    return function () {
      const element = document.getElementById(htmlId) as HTMLInputElement
      if (element) {
        const newValue = element.value
        if (oldValue !== newValue) {
          onChange(field, newValue)
        } else {
          controller.initFieldValidation(field, newValue)
        }
      }
    }
  }

  label(className?: string) {
    const translationKey = this.props.translationKey
    if (this.hideLabel() || !this.props.translations[translationKey]) {
      return undefined
    } else {
      return (
        <label htmlFor={this.props.htmlId} className={this.labelClassName(className)}>
          <LocalizedString
            className={this.props.required ? 'required' : undefined}
            translations={this.props.translations}
            translationKey={translationKey}
            lang={this.props.lang}
          />
          {this.helpText()}
        </label>
      )
    }
  }

  helpText() {
    if (this.props.translations.helpText) {
      return <HelpTooltip content={this.props.translations.helpText} lang={this.props.lang} />
    }
    return undefined
  }

  labelClassName(className?: string) {
    const classNames = ClassNames(className, { disabled: this.props.disabled })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  resolveClassName(className?: string): string | undefined {
    const classNames = ClassNames(className, { error: this.props.hasError })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  hideLabel() {
    return this.props.renderingParameters && this.props.renderingParameters.hideLabels === true
  }
}
