import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class BasicSizedComponent extends BasicFieldComponent {
  sizeClassName() {
    if (this.props.size && !Number.isInteger(this.props.size)) return this.props.size
    else return undefined
  }

  resolveClassName(className) {
    const classNames = ClassNames(className, { error: this.props.hasError }, this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}