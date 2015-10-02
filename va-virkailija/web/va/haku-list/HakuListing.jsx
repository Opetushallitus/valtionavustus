import React, { Component } from 'react'

import { BasicInfoComponent }from 'soresu-form/web/form/component/InfoElement.jsx'

import HakuStatus from '../avustushaku/HakuStatus.jsx'
import HakuPhase from '../avustushaku/HakuPhase.jsx'

export default class HakuListing extends Component {
  render() {
    const hakuList = this.props.hakuList
    const selectedHaku = this.props.selectedHaku
    const controller = this.props.controller

    function onClick(e) {
      controller.createHaku(selectedHaku)
      e.target.blur()
      e.preventDefault()
    }

    const hakuElements = _.map(hakuList, haku => {
      return <HakuRow haku={haku} key={haku.id} selectedHaku={selectedHaku} controller={controller}/> })
    return (
      <div>
        <button id="create-haku" onClick={onClick} >Luo uusi avustushaku</button>
        <table key="hakuListing" className="haku-list overview-list">
          <thead><tr>
            <th className="name-column">Avustushaku</th>
            <th className="status-column">Tila</th>
            <th className="phase-column">Vaihe</th>
            <th className="start-column">Haku alkaa</th>
            <th className="end-column">Haku päättyy</th>
          </tr></thead>
          <tbody>
            {hakuElements}
          </tbody>
        </table>
      </div>
    )
  }
}

class HakuRow extends Component {

  toDateStr(dateTime) {
    return BasicInfoComponent.asDateString(dateTime) + ' ' + BasicInfoComponent.asTimeString(dateTime)
  }

  render() {
    const haku = this.props.haku
    const htmlId = "haku-" + haku.id
    const thisIsSelected = haku === this.props.selectedHaku
    const rowClass = thisIsSelected ? "selected overview-row" : "unselected overview-row"
    const controller = this.props.controller
    return <tr id={htmlId} className={rowClass} onClick={controller.selectHaku(haku)}>
      <td className="name-column">{haku.content.name.fi}</td>
      <td className="status-column"><HakuStatus status={haku.status}/></td>
      <td className="phase-column"><HakuPhase phase={haku.phase}/></td>
      <td className="start-column">{this.toDateStr(haku.content.duration.start)}</td>
      <td className="end-column">{this.toDateStr(haku.content.duration.end)}</td>
    </tr>
  }
}
