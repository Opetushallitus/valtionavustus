import _ from 'lodash'
import React, { Component } from 'react'

import HakemusStatuses from '../hakemus-details/HakemusStatuses.js'
import AvustushakuSelector from '../avustushaku/AvustushakuSelector.jsx'

export default class HakemusListing extends Component {

  _filterWithStrPredicate(field, filter) {
    if(_.isEmpty(filter)) {
      return function() {return true}
    }
    return function(hakemus) {
      if(_.isEmpty(hakemus[field])) {
        return false
      }
      return hakemus[field].toUpperCase().indexOf(filter.toUpperCase()) >= 0
    }
  }

  _filter(list, filter) {
    return _.filter(list, this._filterWithStrPredicate("project-name", filter.name))
            .filter(this._filterWithStrPredicate("organization-name", filter.organization))
  }

  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const selectedHakemus = this.props.selectedHakemus
    const filter = this.props.hakuFilter
    const hakemusList = this.props.hakemusList
    const filteredHakemusList = this._filter(hakemusList, filter)
    const ophShareSum = HakemusListing.formatNumber(_.reduce(filteredHakemusList, (total, hakemus) => { return total + hakemus["budget-oph-share"] }, 0))
    const hakemusElements = _.map(filteredHakemusList, hakemus => {
      return <HakemusRow key={hakemus.id} hakemus={hakemus} selectedHakemus={selectedHakemus} controller={controller}/> })
    const budgetGrantedSum = HakemusListing.formatNumber(_.reduce(filteredHakemusList, (total, hakemus) => { return total + hakemus.arvio["budget-granted"] }, 0))

    const onFilterChange = function(filterId) {
      return function(e) {
        controller.setFilter(filterId, e.target.value)
      }
    }

    return (
      <table key="hakemusListing" className="hakemus-list overview-list">
        <thead><tr>
          <th className="organization-column"><input placeholder="Hakijaorganisaatio" onChange={onFilterChange("organization")} name="filter-by-organization" value={filter.organization}></input></th>
          <th className="project-name-column"><input placeholder="Hanke" onChange={onFilterChange("name")} name="filter-by-name" value={filter.name}></input></th>
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
          <td className="total-applications-column">{filteredHakemusList.length} /  {hakemusList.length} kpl hakemusta</td>
          <td className="applied-sum-column"><span className="money sum">{ophShareSum}</span></td>
          <td className="granted-sum-column"><span className="money sum">{budgetGrantedSum}</span></td>
        </tr></tfoot>
      </table>
    )
  }

  static formatNumber (num) {
    return num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, "$1 ")
  }
}

class HakemusRow extends Component {
  render() {
    const hakemus = this.props.hakemus
    const htmlId = "hakemus-" + hakemus.id
    const thisIsSelected = hakemus === this.props.selectedHakemus
    const rowClass = thisIsSelected ? "selected overview-row" : "unselected overview-row"
    const controller = this.props.controller
    const statusFI = HakemusStatuses.statusToFI(hakemus.arvio.status)
    return <tr id={htmlId} className={rowClass} onClick={controller.selectHakemus(hakemus)}>
      <td className="organization-column">{hakemus["organization-name"]}</td>
      <td className="project-name-column">{hakemus["project-name"]}</td>
      <td className="score-column">***</td>
      <td className="status-column">{statusFI}</td>
      <td className="applied-sum-column"><span className="money">{HakemusListing.formatNumber(hakemus["budget-oph-share"])}</span></td>
      <td className="granted-sum-column"><span className="money">{HakemusListing.formatNumber(hakemus.arvio["budget-granted"])}</span></td>
    </tr>
  }
}
