import React from 'react'
import { useHelpText } from '../initial-data-context'

type HelpTooltipProps = {
  textKey: string
  direction?: string
  testId?: string
}

export const HelpTooltip = ({ direction, testId, textKey }: HelpTooltipProps) => {
  const content = useHelpText(textKey)
  return <CustomHelpTooltip direction={direction} testId={testId} content={content} />
}

type CustomHelpTooltipProps = {
  content: string
  direction?: string
  testId?: string
}

export const CustomHelpTooltip = ({ direction, testId, content }: CustomHelpTooltipProps) => (
  <div
    className={`soresu-tooltip soresu-tooltip-${direction || 'up'} soresu-help-icon`}
    data-test-id={testId || ''}
  >
    <span dangerouslySetInnerHTML={{ __html: content }} />
  </div>
)

/** @deprecated use non-default exports */
export default CustomHelpTooltip
