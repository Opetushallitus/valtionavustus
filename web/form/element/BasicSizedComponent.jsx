import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import BasicFieldComponent from './BasicFieldComponent.jsx'

export default class BasicSizedComponent extends BasicFieldComponent {
  sizeClassName() {
    if (this.param("size") && !Number.isInteger(this.param("size"))) return this.param("size")
    else return undefined
  }

  resolveClassName(className) {
    const classNames = ClassNames(className, { error: !_.isEmpty(this.props.validationErrors)}, this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}