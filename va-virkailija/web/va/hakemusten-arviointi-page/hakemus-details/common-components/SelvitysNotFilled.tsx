import moment from 'moment'
import React from 'react'
import { Avustushaku } from 'soresu-form/web/va/types'

interface Props {
  avustushaku: Avustushaku
  selvitysType: 'Väliselvitys' | 'Loppuselvitys'
}

function createDeadlineText(date: string, selvitysType: Props['selvitysType']) {
  if (selvitysType === 'Loppuselvitys') {
    return `Selvityksen viimeinen toimituspäivämäärä on ${date} tai 2 kuukautta hankkeen päättymisen jälkeen.`
  } else {
    return `Selvityksen viimeinen toimituspäivämäärä on ${date}.`
  }
}

export default function SelvitysNotFilled({ avustushaku, selvitysType }: Props) {
  const date =
    selvitysType === 'Loppuselvitys' ? avustushaku.loppuselvitysdate : avustushaku.valiselvitysdate
  const maybeDate = date ? new Date(date) : undefined
  const dateString =
    maybeDate && moment(maybeDate).isValid() ? maybeDate.toLocaleDateString('fi') : ''
  const deadlineText = createDeadlineText(dateString, selvitysType)
  return (
    <div>
      <p>{selvitysType} ei ole vielä saapunut.</p>
      <p>{deadlineText}</p>
      <p>Yhteyshenkilöä muistutetaan automaattisesti sähköpostitse selvityksen täyttämisestä.</p>
    </div>
  )
}
