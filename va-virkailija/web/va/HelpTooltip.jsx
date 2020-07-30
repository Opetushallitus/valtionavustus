import React from 'react'

export default class HelpTooltip extends React.Component {

  render() {
    return <a className={`soresu-tooltip soresu-tooltip-${this.props.direction || "up"} soresu-help-icon`}
       data-test-id={ this.props.testId || ''}>
      <span>{ this.props.content }</span>
    </a>
  }
}
