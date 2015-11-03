import React from 'react'

import ReactCSSTransitionGroup from 'react-addons-css-transition-group'

export default class CSSTransitionGroup extends React.Component {
  render() {
    const children = this.props.children
    const transitionName = this.props.transitionName
    const component = this.props.component ? this.props.component : "div"
    return (
      <ReactCSSTransitionGroup component={component} transitionName={transitionName} transitionEnterTimeout={500} transitionLeaveTimeout={500}>
        {children}
      </ReactCSSTransitionGroup>
    )
  }
}
