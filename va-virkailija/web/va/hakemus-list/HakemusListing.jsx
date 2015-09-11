import Bacon from 'baconjs'
import _ from 'lodash'
import React, { Component } from 'react'

import HttpUtil from 'va-common/web/HttpUtil.js'
import Dispatcher from 'va-common/web/Dispatcher'

export default class HakemusListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const ophShareSum = this.props.ophShareSum
    const selectedHakemus = this.props.selectedHakemus
    const hakemusElements = _.map(hakemusList, hakemus => {
      const controller = this.props.controller
      return <HakemusRow hakemus={hakemus} key={hakemusList.indexOf(hakemus)}
                         selectedHakemus={selectedHakemus} controller={controller}/> })
    return (
      <table key="hakemusListing" className="hakemus-list">
        <colgroup>
          <col className="organization-column"/>
          <col className="project-name-column"/>
          <col className="score-column"/>
          <col className="status-column"/>
          <col className="applied-sum-column"/>
          <col className="granted-sum-column"/>
        </colgroup>
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
          <td className="applied-sum-column" colSpan="5"><span className="money sum">{ophShareSum}</span></td>
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
    const rowClass = hakemus === selectedHakemus ? "selected" : undefined
    const controller = this.props.controller
    return <tr className={rowClass} key={key} onClick={controller.selectHakemus(hakemus)}>
      <td>{hakemus["organization-name"]}</td>
      <td>{hakemus["project-name"]}</td>
      <td>***</td>
      <td className="status-column">Käsittelemättä</td>
      <td className="applied-sum-column"><span className="money">{hakemus["budget-oph-share"]}</span></td>
      <td className="granted-sum-column"><span hidden="true" className="money"></span></td>
    </tr>
  }
}
