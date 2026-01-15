import React from 'react'
import classNames from 'classnames'
import * as styles from './Pill.module.css'
import { AvustushakuStatus } from 'soresu-form/web/va/types'

const pillStyles = {
  green: styles.greenPill,
  red: styles.redPill,
  yellow: styles.yellowPill,
  grey: styles.greyPill,
  blue: styles.bluePill,
} as const

export const avustushakuStatusColor = {
  new: 'blue',
  draft: 'yellow',
  published: 'green',
  resolved: 'red',
  deleted: 'grey',
} satisfies Record<AvustushakuStatus, keyof typeof pillStyles>

export interface PillProps {
  color: keyof typeof pillStyles
  text: string
  compact?: boolean
  testId?: string | null
}

export const Pill = ({ color, text, compact, testId = null }: PillProps) => (
  <div
    data-test-id={testId}
    className={classNames(pillStyles[color], {
      [styles.compact]: compact,
    })}
  >
    {text}
  </div>
)
