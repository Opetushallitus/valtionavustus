import React, { Component } from 'react'

import HakuStatus from "../avustushaku/HakuStatus.jsx"

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku

    const onChange = e => {
      controller.onChangeListener(avustushaku, e.target, e.target.value)
    }

    const status = avustushaku.status
    const statuses = []
    const statusValues = ['draft', 'published', 'deleted'];
    for (var i=0; i < statusValues.length; i++) {
      const htmlId = "set-status-" + statusValues[i]
      statuses.push(
          <input id={htmlId}
                 type="radio"
                 key={htmlId}
                 name="status"
                 value={statusValues[i]}
                 onChange={onChange}
                 checked={statusValues[i] === status ? true: null}
              />
      )
      statuses.push(
          <label key={htmlId + "-label"}
                 htmlFor={htmlId}>
            <HakuStatus status={statusValues[i]}/>
          </label>
      )
    }

    return (
      <div id="haku-edit">
        <h2>Muokkaa avustushakua</h2>
        <label htmlFor="haku-name-fi">Haun nimi:</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-fi" type="text" value={avustushaku.content.name.fi}/>
        <label htmlFor="haku-name-sv">Haun nimi ruotsiksi:</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-sv" type="text" value={avustushaku.content.name.sv}/>
        <div>
          <label>Avustushaun tila:</label>
          {statuses}
        </div>
      </div>
    )
  }
}
