import React, { Component } from 'react'

export default class HelpTooltip extends Component {

  render() {
    return <a className={`soresu-tooltip soresu-tooltip-${this.props.direction || "up"} soresu-help-icon`}
       data-test-id={ this.props.testId || ''}>
      <span dangerouslySetInnerHTML={{__html: this.props.content}} />
    </a>
  }
}
