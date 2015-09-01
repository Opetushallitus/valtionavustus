import React from 'react'

import TimeoutTransitionGroup from 'timeout-transition-group'

export default class CSSTransitionGroup extends React.Component {
  render() {
    const children = this.props.children
    const transitionName = this.props.transitionName
    return (
      <TimeoutTransitionGroup component="div" transitionName={transitionName} enterTimeout={500} leaveTimeout={500}>
        {children}
      </TimeoutTransitionGroup>
    )
  }
}
