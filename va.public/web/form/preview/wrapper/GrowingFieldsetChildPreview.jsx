import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

export default class GrowingFieldsetChildPreviewElement extends React.Component {
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