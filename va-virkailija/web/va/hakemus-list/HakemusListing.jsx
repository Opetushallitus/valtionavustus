import _ from 'lodash'
import React, { Component } from 'react'

import HakemusStatuses from '../hakemus-details/HakemusStatuses.js'

export default class HakemusListing extends Component {

  _filterWithArrayPredicate(fieldGetter, filter) {
    if(_.isEmpty(filter)) {
      return function() {return true}
    }
    return function(hakemus) {
      return _.contains(filter, fieldGetter(hakemus))
    }
  }

  _filterWithStrPredicate(fieldGetter, filter) {
    if(_.isEmpty(filter)) {
      return function() {return true}
    }
    return function(hakemus) {
      if(_.isEmpty(fieldGetter(hakemus))) {
        return false
      }
      return fieldGetter(hakemus).toUpperCase().indexOf(filter.toUpperCase()) >= 0
    }
  }
  _filter(list, filter) {
    return _.filter(list, this._filterWithStrPredicate(hakemus => hakemus["project-name"], filter.name))
            .filter(this._filterWithStrPredicate(hakemus => hakemus["organization-name"], filter.organization))
            .filter(this._filterWithArrayPredicate(hakemus => hakemus.arvio.status, filter.status))

  }

  render() {
    const controller = this.props.controller
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
          <th className="organization-column"><input className="text-filter" placeholder="Hakijaorganisaatio" onChange={onFilterChange("organization")} value={filter.organization}></input></th>
          <th className="project-name-column"><input className="text-filter" placeholder="Hanke" onChange={onFilterChange("name")} value={filter.name}></input></th>
          <th className="score-column">Arvio</th>
          <th className="status-column"><StatusFilter controller={controller} filter={filter}/></th>
          <th className="applied-sum-column">Haettu</th>
          <th className="granted-sum-column">Myönnetty</th>
        </tr></thead>
        <tbody>
          {hakemusElements}
        </tbody>
        <tfoot><tr>
          <td className="total-applications-column">{filteredHakemusList.length}/{hakemusList.length} hakemusta</td>
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

class StatusFilter extends Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.state = { open: false }
  }

  handleClick() {
    this.setState({
      open: !this.state.open
    })
  }

  render() {
    const controller = this.props.controller
    const statusFilter = this.props.filter.status
    const statuses = []
    const onCheckboxChange = function(status) {
      return function(e) {
        if(_.contains(statusFilter, status)) {
          controller.setFilter("status",  _.without(statusFilter, status))
        }
        else {
          controller.setFilter("status", _.union(statusFilter, [status]))
        }
      }
    }

    const statusValues = HakemusStatuses.allStatuses()
    for (var i=0; i < statusValues.length; i++) {
      const status = statusValues[i]
      const checked = _.contains(statusFilter, status)
      const htmlId = "filter-by-status-" + status
      statuses.push(
        <div>
          <input id={htmlId} key={status} type="checkbox" checked={checked} onChange={onCheckboxChange(status)} value={statusValues[status]}/>
          <label htmlFor={htmlId}>{HakemusStatuses.statusToFI(status)}</label>
        </div>
      )
    }
    return (
      <div className="status-filter">
        <a onClick={this.handleClick}>Tila</a>
        <div className="status-filter-popup popup-box-shadow" hidden={!this.state.open}>
          {statuses}
        </div>
      </div>
    )
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
