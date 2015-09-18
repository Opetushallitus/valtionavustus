import React, { Component } from 'react'

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku

    return (
      <div id="haku-edit">
        <h2>Muokkaa avustushakua</h2>
        <label htmlFor="haku-name-fi">Haun nimi:</label><input size="100" maxLength="200" id="haku-name-fi" type="text" value={avustushaku.content.name.fi}/>
        <label htmlFor="haku-name-sv">Haun nimi ruotsiksi:</label><input size="100" maxLength="200" maxlength="" id="haku-name-sv" type="text" value={avustushaku.content.name.sv}/>
      </div>
    )
  }
}
