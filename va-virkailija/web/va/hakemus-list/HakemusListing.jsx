import Bacon from 'baconjs'
import _ from 'lodash'
import React, { Component } from 'react'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'va-common/web/Dispatcher'

import HakemusStatus from '../hakemus-details/HakemusStatus.jsx'
import AvustushakuSelector from '../avustushaku/AvustushakuSelector.jsx'

export default class HakemusListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const avustushaku = this.props.avustushaku
    const ophShareSum = this.props.ophShareSum
    const selectedHakemus = this.props.selectedHakemus
    const controller = this.props.controller
    const hakemusElements = _.map(hakemusList, hakemus => {
      return <HakemusRow hakemus={hakemus} key={hakemusList.indexOf(hakemus)}
                         selectedHakemus={selectedHakemus} controller={controller}/> })
    return (
      <table key="hakemusListing" className="hakemus-list">
        <thead><tr>
          <th className="organization-column">Hakijaorganisaatio</th>
          <th className="project-name-column">Hanke</th>
          <th className="score-column">Arvio</th>
          <th className="status-column">Tila</th>
          <th className="applied-sum-column">Haettu</th>
          <th className="granted-sum-column">Myönnetty</th>
        </tr></thead>
        <tbody>
          {hakemusElements}
        </tbody>
        <tfoot><tr>
          <td className="avustushaku-selector-column"><AvustushakuSelector avustushaku={avustushaku} controller={controller} /></td>
          <td className="applied-sum-column"><span className="money sum">{ophShareSum}</span></td>
          <td className="granted-sum-column"><span className="money sum">TODO</span></td>
        </tr></tfoot>
      </table>
    )
  }
}

class HakemusRow extends Component {
  render() {
    const key = this.props.key
    const hakemus = this.props.hakemus
    const selectedHakemus = this.props.selectedHakemus
    const rowClass = hakemus === selectedHakemus ? "selected hakemus-row" : "unselected hakemus-row"
    const controller = this.props.controller
    return <tr className={rowClass} key={key} onClick={controller.selectHakemus(hakemus)}>
      <td className="organization-column">{hakemus["organization-name"]}</td>
      <td className="project-name-column">{hakemus["project-name"]}</td>
      <td className="score-column">***</td>
      <td className="status-column"><HakemusStatus status={hakemus.arvio.status}/></td>
      <td className="applied-sum-column"><span className="money">{hakemus["budget-oph-share"]}</span></td>
      <td className="granted-sum-column"><span className="money">0</span></td>
    </tr>
  }
}
