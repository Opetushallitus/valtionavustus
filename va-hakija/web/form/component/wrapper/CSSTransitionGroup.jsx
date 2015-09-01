import React from 'react'

export default class CSSTransitionGroup extends React.Component {
  render() {
    const children = this.props.children
    const transitionName = this.props.transitionName
    const ReactTransitionGroup = React.addons.CSSTransitionGroup
    return (
      <ReactTransitionGroup component="div" transitionName={transitionName}>
        {children}
      </ReactTransitionGroup>
    )
  }
}
