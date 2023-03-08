import React from 'react'

type HelpTooltipProps = {
  content: string
  direction?: string
  testId?: string
}

export default class HelpTooltip extends React.Component<HelpTooltipProps> {
  render() {
    return (
      <a
        className={`soresu-tooltip soresu-tooltip-${this.props.direction || 'up'} soresu-help-icon`}
        data-test-id={this.props.testId || ''}
      >
        <span dangerouslySetInnerHTML={{ __html: this.props.content }} />
      </a>
    )
  }
}
