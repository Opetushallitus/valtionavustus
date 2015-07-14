import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import ThemeWrapperElement from './../../element/wrapper/WrapperElement.jsx'
import FieldsetPreview from './FieldsetPreview.jsx'
import GrowingFieldsetPreview from './GrowingFieldsetPreview.jsx'
import GrowingFieldsetChildPreview from './GrowingFieldsetChildPreview.jsx'

export default class WrapperPreviewElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement,
      "fieldset": FieldsetPreview,
      "growingFieldset": GrowingFieldsetPreview,
      "growingFieldsetChild": GrowingFieldsetChildPreview
    }
  }

  render() {
    const field = this.props.field
    const displayAs = field.displayAs

    var element = <span>{this.constructor.name} : Unsupported field type {displayAs}</span>

    if (displayAs in this.fieldTypeMapping) {
      element = React.createElement(this.fieldTypeMapping[displayAs], this.props)
    }
    return element
  }
}