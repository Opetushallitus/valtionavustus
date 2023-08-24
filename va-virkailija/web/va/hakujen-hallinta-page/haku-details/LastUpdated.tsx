import React from 'react'
import moment from 'moment-timezone'
import { fiLongDateTimeFormatWithKlo } from 'soresu-form/web/va/i18n/dateformat'

type LastUpdatedProps = {
  updatedAt?: Date | string
  id: string
}

const secondsAndMillisFormat = 'ss,SSS'

export const LastUpdated = (props: LastUpdatedProps) => {
  if (!props.updatedAt) return null

  const updated = moment(props.updatedAt).tz('Europe/Helsinki')
  const formattedUpdatedAt = updated.format(fiLongDateTimeFormatWithKlo)
  const seconds = updated.format(secondsAndMillisFormat)

  return (
    <div id={props.id}>
      <span className="date"> Päivitetty: {formattedUpdatedAt}</span>
      <span style={{ display: 'none' }}>.{seconds}</span>
    </div>
  )
}
