import _ from 'lodash'
import React, { Component } from 'react'

import HakemusStatuses from '../hakemus-details/HakemusStatuses.js'

export default class HakemusListing extends Component {

  static _filterWithArrayPredicate(fieldGetter, filter) {
    return function(hakemus) {
      return _.contains(filter, fieldGetter(hakemus))
    }
  }

  static _filterWithStrPredicate(fieldGetter, filter) {
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

  static _filter(list, filter) {
    return _.filter(list, HakemusListing._filterWithStrPredicate(hakemus => hakemus["project-name"], filter.name))
            .filter(HakemusListing._filterWithStrPredicate(hakemus => hakemus["organization-name"], filter.organization))
            .filter(HakemusListing._filterWithArrayPredicate(hakemus => hakemus.arvio.status, filter.status))

  }

  render() {
    const controller = this.props.controller
    const selectedHakemus = this.props.selectedHakemus
    const filter = this.props.hakuFilter
    const hakemusList = this.props.hakemusList
    const filteredHakemusList = HakemusListing._filter(hakemusList, filter)
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
          <th className="status-column"><StatusFilter controller={controller} hakemusList={hakemusList} filter={filter}/></th>
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
    this.render = this.render.bind(this)
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
    const hakemusList = this.props.hakemusList
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
    const self = this
    const onDelete = function(e) {
      self.setState({
        open: false
      })
      controller.setFilter("status", statusValues)
    }
    const hasFilters = statusFilter.length !== statusValues.length

    for (var i=0; i < statusValues.length; i++) {
      const status = statusValues[i]
      const checked = _.contains(statusFilter, status)
      const htmlId = "filter-by-status-" + status
      const kpl = _.filter(hakemusList, HakemusListing._filterWithArrayPredicate(hakemus => hakemus.arvio.status, [status])).length
      statuses.push(
        <div key={status}>
          <input id={htmlId} type="checkbox" checked={checked} onChange={onCheckboxChange(status)} value={statusValues[status]}/>
          <label htmlFor={htmlId}>{HakemusStatuses.statusToFI(status)} ({kpl})</label>
        </div>
      )
    }
    return (
      <div className="status-filter">
        <a onClick={this.handleClick}>Tila</a>
        <button hidden={!hasFilters} onClick={onDelete} className="filter-remove" alt="Poista tila rajaukset" title="Poista tila rajaukset" tabIndex="-1" />
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
