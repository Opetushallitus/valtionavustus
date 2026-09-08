import React, { useState } from 'react'
import { Moment } from 'moment'
import DateUtil from 'soresu-form/web/DateUtil'
import { isoDateTimeFormat, isoFormat } from 'soresu-form/web/va/i18n/dateformat'
import { DateInput } from './DateInput'
import * as styles from './Hakuaika.module.css'

interface HakuaikaProps {
  start: string | Date
  end: string | Date
  startDisabled: boolean
  endDisabled: boolean
  durationText?: string
  onChange: (id: string, date: Moment, format: string, immediate?: boolean) => void
}

export const Hakuaika = ({
  start,
  end,
  startDisabled,
  endDisabled,
  durationText,
  onChange,
}: HakuaikaProps) => {
  const [startValid, setStartValid] = useState(true)
  const [endValid, setEndValid] = useState(true)
  return (
    <div className={styles.container}>
      <div className={styles.fields}>
        <DateInput
          id="hakuaika-start"
          label="Alkaa"
          includeTime
          defaultValue={new Date(start)}
          onChange={(id, date) => onChange(id, date, isoDateTimeFormat)}
          onValidityChange={setStartValid}
          allowEmpty={false}
          disabled={startDisabled}
        />
        <span className={styles.divider} aria-hidden="true" />
        <DateInput
          id="hakuaika-end"
          label="Päättyy"
          defaultValue={new Date(end)}
          onChange={(id, date) => onChange(id, date, isoFormat, true)}
          onValidityChange={setEndValid}
          allowEmpty={false}
          disabled={endDisabled}
          suffix={<span data-test-id="hakuaika-end-time">klo {DateUtil.asTimeString(end)}</span>}
        />
      </div>
      {startValid && endValid && durationText && (
        <div className={styles.duration}>
          Hakuajan kesto: <span data-test-id="hakuaika-duration">{durationText}</span>
        </div>
      )}
    </div>
  )
}
