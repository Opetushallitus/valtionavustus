import React from 'react'

type HelpTooltipProps = {
  content: string
  direction?: string
  testId?: string
}

const HelpTooltip = ({ direction, testId, content }: HelpTooltipProps) => (
  <div
    className={`soresu-tooltip soresu-tooltip-${direction || 'up'} soresu-help-icon`}
    data-test-id={testId || ''}
  >
    <span dangerouslySetInnerHTML={{ __html: content }} />
  </div>
)

export default HelpTooltip
