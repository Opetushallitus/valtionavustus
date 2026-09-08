import React, { useEffect, useState } from 'react'
import moment, { Moment } from 'moment'
import DateUtil from 'soresu-form/web/DateUtil'
import {
  isoDateTimeFormat,
  isoFormat,
  parseFinnishTimestamp,
} from 'soresu-form/web/va/i18n/dateformat'
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
  const savedStart = new Date(start).getTime()
  const savedEnd = new Date(end).getTime()
  const [draftStart, setDraftStart] = useState(() => moment(start))
  const [draftEnd, setDraftEnd] = useState(() => moment(end))
  const validRange = draftEnd.isAfter(draftStart)

  useEffect(() => {
    setDraftStart(moment(savedStart))
    setDraftEnd(moment(savedEnd))
  }, [savedStart, savedEnd])

  const updateRange = (nextStart: Moment, nextEnd: Moment) => {
    setDraftStart(nextStart)
    setDraftEnd(nextEnd)
    if (!nextEnd.isAfter(nextStart)) return

    const saveStart = () => {
      if (nextStart.valueOf() !== savedStart) {
        onChange('hakuaika-start', nextStart, isoDateTimeFormat)
      }
    }
    const saveEnd = () => {
      if (nextEnd.valueOf() !== savedEnd) {
        onChange('hakuaika-end', nextEnd, isoFormat, true)
      }
    }
    // Both drafts may have changed. Keep the interval valid during each store update.
    if (nextStart.valueOf() >= savedEnd) {
      saveEnd()
      saveStart()
    } else {
      saveStart()
      saveEnd()
    }
  }
  return (
    <div className={styles.container}>
      <div className={styles.fields}>
        <DateInput
          id="hakuaika-start"
          label="Alkaa"
          includeTime
          defaultValue={draftStart.toDate()}
          onChange={(_id, date) =>
            updateRange(
              parseFinnishTimestamp(date.format(isoDateTimeFormat), isoDateTimeFormat, true),
              draftEnd
            )
          }
          onValidityChange={setStartValid}
          allowEmpty={false}
          disabled={startDisabled}
        />
        <span className={styles.divider} aria-hidden="true" />
        <DateInput
          id="hakuaika-end"
          label="Päättyy"
          defaultValue={draftEnd.toDate()}
          onChange={(_id, date) => {
            const nextEnd = parseFinnishTimestamp(date.format(isoFormat), isoFormat, true)
            // As on the server, keep a legacy closing time when its date is unchanged.
            updateRange(
              draftStart,
              nextEnd.format(isoFormat) === moment(savedEnd).tz('Europe/Helsinki').format(isoFormat)
                ? moment(savedEnd)
                : nextEnd.endOf('day')
            )
          }}
          onValidityChange={setEndValid}
          allowEmpty={false}
          disabled={endDisabled}
          error={
            startValid && endValid && !validRange
              ? 'Päättymisajan pitää olla alkamisajan jälkeen.'
              : undefined
          }
          suffix={
            <span data-test-id="hakuaika-end-time">
              klo {DateUtil.asTimeString(draftEnd.toDate())}
            </span>
          }
        />
      </div>
      {startValid && endValid && validRange && durationText && (
        <div className={styles.duration}>
          Hakuajan kesto: <span data-test-id="hakuaika-duration">{durationText}</span>
        </div>
      )}
    </div>
  )
}
