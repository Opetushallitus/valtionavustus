import React from 'react'
import moment from 'moment-timezone'
import { fiLongDateTimeFormatWithKlo } from 'va-common/web/va/i18n/dateformat'

type LastUpdatedProps = {
  updatedAt: Date
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
      Päivitetty: {formattedUpdatedAt}<span style={{display: 'none'}}>.{seconds}</span>
    </div>
  )
}
