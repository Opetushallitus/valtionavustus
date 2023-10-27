import { isDate } from 'moment'
import React, { Component } from 'react'

export default class SelvitysNotFilled extends Component {
  render() {
    const { avustushaku, selvitysType } = this.props
    const title = selvitysType === 'valiselvitys' ? 'Väliselvitys' : 'Loppuselvitys'
    const date = avustushaku[selvitysType + 'date']
    const maybeDate = new Date(date)
    const dateString = isDate(maybeDate) ? maybeDate.toLocaleDateString('fi') : ''

    return (
      <div>
        <p>{title} ei ole vielä saapunut.</p>
        <p>
          Selvityksen viimeinen toimituspäivämäärä on {dateString} tai 2 kuukautta hankkeen päättymisen
          jälkeen.
        </p>

        <p>Yhteyshenkilöä muistutetaan automaattisesti sähköpostitse selvityksen täyttämisestä.</p>
      </div>
    )
  }
}
