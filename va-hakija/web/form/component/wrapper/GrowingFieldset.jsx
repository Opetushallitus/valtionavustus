import React from 'react/addons'
import ClassNames from 'classnames'
import _ from 'lodash'
import CSSTransitionGroup from './CSSTransitionGroup.jsx'

export default class GrowingFieldset extends React.Component {
  className(className) {
    const field = this.props.field
    const classNames = ClassNames(className, { "show-only-first-label": field.params.showOnlyFirstLabels })
    return !_.isEmpty(classNames) ? classNames : undefined
  }

  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset id={htmlId} className={this.className("soresu-growing-fieldset")}>
        <ol>
          <CSSTransitionGroup transitionName="soresu-dynamic-children-transition">
            {children}
          </CSSTransitionGroup>
        </ol>
      </fieldset>
    )
  }
}
