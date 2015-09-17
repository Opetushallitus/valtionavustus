import React, { Component } from 'react'

export default class HakuListing extends Component {
  render() {
    const hakuList = this.props.hakuList
    const selectedHaku = this.props.selectedHaku
    const controller = this.props.controller
    const hakuElements = _.map(hakuList, haku => {
      return <HakuRow haku={haku} key={hakuList.indexOf(haku)}
                      selectedHaku={selectedHaku} controller={controller}/> })
    return (
      <table key="hakuListing" className="haku-list overview-list">
        <thead><tr>
          <th className="name-column">Haku</th>
          <th className="start-column">Alkaa</th>
          <th className="end-column">Loppuu</th>
        </tr></thead>
        <tbody>
          {hakuElements}
        </tbody>
      </table>
    )
  }
}

class HakuRow extends Component {
  render() {
    const key = this.props.key
    const haku = this.props.haku
    const selectedHaku = this.props.selectedHaku
    const rowClass = haku === selectedHaku ? "selected overview-row" : "unselected overview-row"
    const controller = this.props.controller
    return <tr className={rowClass} key={key} onClick={controller.selectHaku(haku)}>
      <td className="name-column">{haku.content.name.fi}</td>
      <td className="start-column">{haku.content.duration.start}</td>
      <td className="end-column">{haku.content.duration.end}</td>
    </tr>
  }
}
