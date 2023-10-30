import { isDate } from 'moment'
import React from 'react'
import { Avustushaku } from 'soresu-form/web/va/types'

interface Props {
  avustushaku: Avustushaku
  selvitysType: 'Väliselvitys' | 'Loppuselvitys'
}

export default function SelvitysNotFilled({ avustushaku, selvitysType }: Props) {
  const date =
    selvitysType === 'Loppuselvitys' ? avustushaku.loppuselvitysdate : avustushaku.valiselvitysdate

  const maybeDate = date && new Date(date)
  const dateString = isDate(maybeDate) ? maybeDate.toLocaleDateString('fi') : ''

  return (
    <div>
      <p>{selvitysType} ei ole vielä saapunut.</p>
      <p>Selvityksen viimeinen toimituspäivämäärä on {dateString}</p>
      <p>Yhteyshenkilöä muistutetaan automaattisesti sähköpostitse selvityksen täyttämisestä.</p>
    </div>
  )
}
