import React from 'react'
import moment from 'moment-timezone'

type LastUpdatedProps = {
  updatedAt: Date
  id: string
}

const finnishDateTimeFormat = 'D.M.YYYY [klo] H.mm'
const secondsAndMillisFormat = 'ss,SSS'

export const LastUpdated = (props: LastUpdatedProps) => {

  if (!props.updatedAt) return null

  const updated = moment(props.updatedAt).tz('Europe/Helsinki')
  const formattedUpdatedAt = updated.format(finnishDateTimeFormat)
  const seconds = updated.format(secondsAndMillisFormat)

  return (
    <div style={{'textAlign':'right'}} id={props.id}>
      Päivitetty: {formattedUpdatedAt}<span style={{display: 'none'}}>.{seconds}</span>
    </div>
  )
}
