import React, { Component } from 'react'

import HakuStatus from "../avustushaku/HakuStatus.jsx"

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
        <label htmlFor="haku-name-fi">Haun nimi</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-fi" type="text" value={avustushaku.content.name.fi}/>
        <label htmlFor="haku-name-sv">Haun nimi ruotsiksi</label><input onChange={onChange} size="100" maxLength="200" id="haku-name-sv" type="text" value={avustushaku.content.name.sv}/>
        <SetStatus currentStatus={avustushaku.status} onChange={onChange} />
        <SelectionCriteria controller={controller} avustushaku={avustushaku} onChange={onChange} />
      </div>
    )
  }
}

class SelectionCriteria extends React.Component {
  render() {
    const avustushaku = this.props.avustushaku
    const selectionCriteria = avustushaku.content['selection-criteria']
    const controller = this.props.controller
    const onChange = this.props.onChange
    const criteriaItems = []
    for (var index=0; index < selectionCriteria.items.length; index++) {
      const htmlId = "selection-criteria-" + index + "-"
      criteriaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "fi"} value={selectionCriteria.items[index].fi}/></td>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "sv"} value={selectionCriteria.items[index].sv}/></td>
          <td><button className="remove" onClick={controller.deleteSelectionCriteria(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={avustushaku.status === "published"} /></td>
        </tr>
      )
    }

    return (
      <table id="selection-criteria">
        <thead><tr><th>{selectionCriteria.label.fi}</th><th>{selectionCriteria.label.sv}</th></tr></thead>
        <tbody>
        {criteriaItems}
        </tbody>
        <tfoot><tr><td><button onClick={controller.addSelectionCriteria(avustushaku)}>Lisää uusi valintaperuste</button></td></tr></tfoot>
      </table>
    )
  }
}

class SetStatus extends React.Component {
  render() {
    const currentStatus = this.props.currentStatus
    const onChange = this.props.onChange
    const statuses = []
    const statusValues = ['deleted', 'draft', 'published'];
    for (var i=0; i < statusValues.length; i++) {
      const htmlId = "set-status-" + statusValues[i]
      statuses.push(
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="status"
               value={statusValues[i]}
               onChange={onChange}
               checked={statusValues[i] === currentStatus ? true: null}
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
      <div>
        <h3>Tila</h3>
        {statuses}
      </div>
    )
  }
}
