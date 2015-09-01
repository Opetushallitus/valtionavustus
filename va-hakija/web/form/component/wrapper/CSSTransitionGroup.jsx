import React from 'react'

import TimeoutTransitionGroup from 'timeout-transition-group'

export default class CSSTransitionGroup extends React.Component {
  render() {
    const children = this.props.children
    const transitionName = this.props.transitionName
    const component = this.props.component ? this.props.component : "div"
    return (
      <TimeoutTransitionGroup component={component} transitionName={transitionName} enterTimeout={500} leaveTimeout={500}>
        {children}
      </TimeoutTransitionGroup>
    )
  }
}
