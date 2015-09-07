import Bacon from 'baconjs'
import _ from 'lodash'
import HttpUtil from '../HttpUtil.js'
import Dispatcher from '../Dispatcher.js'
import React, { Component } from 'react'

export default class HakemusListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const handleRowClick = this.props.handleRowClick
    const hakemusElements = _.map(hakemusList, hakemus => {
      return <HakemusRow hakemus={hakemus} key={hakemusList.indexOf(hakemus)} handleRowClick={handleRowClick}/> })
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
          <td className="applied-sum-column" colSpan="5"><span className="money sum">TODO</span></td>
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
    const handleRowClick = this.props.handleRowClick
    return <tr key={key} onClick={handleRowClick(hakemus)}>
      <td>{hakemus.organization_name}</td>
      <td>{hakemus.project_name}</td>
      <td>TODO</td>
      <td className="status-column">{hakemus.status}</td>
      <td className="applied-sum-column"><span className="money">{hakemus.budget_oph_share}</span></td>
      <td className="granted-sum-column"><span className="money">TODO</span></td>
    </tr>
  }
}