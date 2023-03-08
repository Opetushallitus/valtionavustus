import React from 'react'
import ClassNames from 'classnames'
import _ from 'lodash'
import CSSTransitionGroup from './CSSTransitionGroup.jsx'
import BasicFieldComponent from 'soresu-form/web/form/component/BasicFieldComponent'

export default class GrowingFieldset extends BasicFieldComponent {
  className(className) {
    const field = this.props.field
    const classNames = ClassNames(className, {
      'show-only-first-label': field.params.showOnlyFirstLabels,
    })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    const labelText = this.props.field.label?.[this.props.lang]
    return (
      <fieldset id={htmlId} className={this.className('soresu-growing-fieldset')}>
        {!!labelText && <legend>{labelText}</legend>}
        <ol>
          <CSSTransitionGroup
            component="span"
            transitionName="soresu-growing-fieldset-child-transition"
          >
            {children}
          </CSSTransitionGroup>
        </ol>
      </fieldset>
    )
  }
}
