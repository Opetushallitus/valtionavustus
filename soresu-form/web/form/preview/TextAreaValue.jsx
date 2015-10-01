import React from 'react'
import BasicValue from './BasicValue.jsx'
import ClassNames from 'classnames'

export default class TextAreaValue extends BasicValue {
  className() {
    const classNames = ClassNames("soresu-preview-element", "soresu-text-area", this.sizeClassName())
    return !_.isEmpty(classNames) ? classNames : undefined
  }
}
