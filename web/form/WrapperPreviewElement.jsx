import React from 'react'
import ClassNames from 'classnames'
import Translator from './Translator.js'
import LocalizedString from './element/LocalizedString.jsx'
import ThemeWrapperElement from './WrapperElement.jsx'
import _ from 'lodash'


class FieldsetPreviewElement extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <div className="soresu-preview-fieldset" id={htmlId}>
        {children}
      </div>
    )
  }
}

class GrowingFieldsetPreviewElement extends React.Component {
  className(className) {
    const field = this.props.field
    const classNames = ClassNames(className, {"show-only-first-label": field.params.showOnlyFirstLabels })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <div id={htmlId} className={this.className("soresu-preview-growing-fieldset")}>
        <ol>
          {children}
        </ol>
      </div>
    )
  }
}

class GrowingFieldsetChildPreviewElement extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <li className={this.className()}>
        <div id={htmlId}>
          {children}
        </div>
      </li>
    )
  }

  className() {
    const classNames = ClassNames("soresu-preview-growing-fieldset-child", {hidden: this.isHidden()})
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  isHidden() {
    return this.props.renderingParameters && this.props.renderingParameters.valueIsEmpty === true;
  }
}

export default class WrapperPreviewElement extends React.Component {
  constructor(props) {
    super(props)
    this.fieldTypeMapping = {
      "theme": ThemeWrapperElement,
      "fieldset": FieldsetPreviewElement,
      "growingFieldset": GrowingFieldsetPreviewElement,
      "growingFieldsetChild": GrowingFieldsetChildPreviewElement
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