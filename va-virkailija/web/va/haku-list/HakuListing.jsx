import React, { Component } from 'react'

import { BasicInfoComponent }from 'va-common/web/form/component/InfoElement.jsx'

export default class HakuListing extends Component {
  render() {
    function onClick(e) {
      controller.createHaku()
      e.target.blur()
      e.preventDefault()
    }
    const hakuList = this.props.hakuList
    const selectedHaku = this.props.selectedHaku
    const controller = this.props.controller
    const hakuElements = _.map(hakuList, haku => {
      return <HakuRow haku={haku} key={haku.id} selectedHaku={selectedHaku} controller={controller}/> })
    return (
      <div>
        <button id="create-haku" onClick={onClick} >Luo uusi avustushaku</button>
        <table key="hakuListing" className="haku-list overview-list">
          <thead>
          <tr>
            <th className="name-column">Avustushaku</th>
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
      <td className="start-column">{this.toDateStr(haku.content.duration.start)}</td>
      <td className="end-column">{this.toDateStr(haku.content.duration.end)}</td>
    </tr>
  }
}
