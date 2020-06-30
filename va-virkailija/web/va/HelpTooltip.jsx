import React from 'react'

export default class HelpTooltip extends React.Component {

  render() {
    return <a className={`soresu-tooltip soresu-tooltip-${this.props.direction || "up"} soresu-help-icon`}>
      <span>{ this.props.content }</span>
    </a>
  }
}
