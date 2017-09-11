import _ from 'lodash'
import React from 'react'
import {TransitionGroup, CSSTransition} from 'react-transition-group'

export default class CSSTransitionGroup extends React.Component {
  render() {
    const children = this.props.children
    const transitionName = this.props.transitionName
    const component = this.props.component ? this.props.component : "div"
    const transitions = _.map(children, (item, index) => {
      const key = item.key || index
      return (
        <CSSTransition key={key}
                       classNames={transitionName}
                       timeout={500}>
          {item}
        </CSSTransition>
    )})
    return (
      <TransitionGroup component={component}>
        {transitions}
      </TransitionGroup>
    )
  }
}
