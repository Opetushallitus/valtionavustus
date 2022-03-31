import { Component } from 'react';

import CSSTransitionGroup from '../../component/wrapper/CSSTransitionGroup.jsx'

export default class FieldsetPreview extends Component {
  render() {
    const children = this.props.children
    const htmlId = this.props.htmlId
    return (
      <div className="soresu-preview-fieldset" id={htmlId}>
        <CSSTransitionGroup transitionName="soresu-dynamic-children-transition">
          {children}
        </CSSTransitionGroup>
      </div>
    )
  }
}