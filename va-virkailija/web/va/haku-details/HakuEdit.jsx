import React, { Component } from 'react'

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku

    const onChange = e => {
      controller.onChangeListener(avustushaku, e.target, e.target.value)
    }

    return (
      <div id="haku-edit">
        <h2>Muokkaa avustushakua</h2>
        <label htmlFor="haku-name-fi">Haun nimi:</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-fi" type="text" value={avustushaku.content.name.fi}/>
        <label htmlFor="haku-name-sv">Haun nimi ruotsiksi:</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-sv" type="text" value={avustushaku.content.name.sv}/>
      </div>
    )
  }
}
