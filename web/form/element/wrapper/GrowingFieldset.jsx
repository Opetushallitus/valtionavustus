import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'

export default class GrowingFieldset extends React.Component {
  className() {
    const field = this.props.field
    const classNames = ClassNames({ showOnlyFirstLabel: field.params.showOnlyFirstLabels })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset id={htmlId} className={this.className()}>
        <ol>
          {children}
        </ol>
      </fieldset>
    )
  }
}
