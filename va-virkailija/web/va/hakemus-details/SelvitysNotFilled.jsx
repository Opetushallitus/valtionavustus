import React, { Component } from 'react'

export default class SelvitysNotFilled extends Component {
  render() {
    const {avustushaku, selvitysType} = this.props
    const title = selvitysType == "valiselvitys" ? "Väliselvitys" : "Loppuselvitys"
    const date = avustushaku[selvitysType + "date"]
    return <div>
      <p>{title} ei ole vielä saapunut.</p>
      <p>Selvityksen viimeinen toimituspäivämäärä on {date} tai 2 kuukautta hankkeen päättymisen jälkeen.</p>

      <p>Yhteyshenkilöä muistutetaan automaattisesti sähköpostitse selvityksen täyttämisestä.</p>

    </div>
  }

}