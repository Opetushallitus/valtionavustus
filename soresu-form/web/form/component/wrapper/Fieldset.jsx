import React from 'react'

import CSSTransitionGroup from './CSSTransitionGroup.jsx'

export default class Fieldset extends React.Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <fieldset className="soresu-fieldset" id={htmlId}>
        <CSSTransitionGroup transitionName="soresu-dynamic-children-transition">
          {children}
        </CSSTransitionGroup>
      </fieldset>
    )
  }
}
