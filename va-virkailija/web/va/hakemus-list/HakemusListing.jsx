import _ from 'lodash'
import React, { Component } from 'react'

import HakemusStatuses from '../hakemus-details/HakemusStatuses.js'

export default class HakemusListing extends Component {

  static _fieldGetter(fieldName) {
    switch(fieldName) {
      case "name":
        return hakemus => hakemus["project-name"]
      case "organization":
        return hakemus => hakemus["organization-name"]
      case "status":
        return hakemus => hakemus.arvio.status
      case "applied-sum":
        return hakemus => hakemus["budget-oph-share"]
      case "granted-sum":
        return hakemus => hakemus.arvio["budget-granted"]
    }
    throw Error("No field getter for " + fieldName)
  }

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
    return _.filter(list, HakemusListing._filterWithStrPredicate(HakemusListing._fieldGetter("name"), filter.name))
            .filter(HakemusListing._filterWithStrPredicate(HakemusListing._fieldGetter("organization"), filter.organization))
            .filter(HakemusListing._filterWithArrayPredicate(HakemusListing._fieldGetter("status"), filter.status))

  }

  static _sortByArray(fieldGetter, array, order) {
    return function(hakemus) {
      const sortValue = array.indexOf(fieldGetter(hakemus))
      return order === 'asc' ? sortValue: - sortValue
    }
  }

  static _sortBy(list, sorter) {
    switch (sorter.field) {
      case "status":
        return _.sortBy(list, HakemusListing._sortByArray(hakemus => hakemus.arvio.status, HakemusStatuses.allStatuses(), sorter.order))
    }
    return _.sortByOrder(list, HakemusListing._fieldGetter(sorter.field), sorter.order)
  }

  static _sort(list, sorterList) {
    return _.reduce(sorterList, HakemusListing._sortBy, list)

  }

  render() {
    const controller = this.props.controller
    const selectedHakemus = this.props.selectedHakemus
    const filter = this.props.hakemusFilter
    const sorter = this.props.hakemusSorter
    const hakemusList = this.props.hakemusList
    const filteredHakemusList = HakemusListing._sort(HakemusListing._filter(hakemusList, filter), sorter)
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
          <th className="organization-column">
            <input className="text-filter" placeholder="Hakijaorganisaatio" onChange={onFilterChange("organization")} value={filter.organization}></input>
            <HakemusSorter field="organization" sorter={sorter} controller={controller}/>
          </th>
          <th className="project-name-column">
            <input className="text-filter" placeholder="Hanke" onChange={onFilterChange("name")} value={filter.name}></input>
            <HakemusSorter field="name" sorter={sorter} controller={controller}/>
          </th>
          <th className="score-column">Arvio</th>
          <th className="status-column">
            <StatusFilter controller={controller} hakemusList={hakemusList} filter={filter}/>
            <HakemusSorter field="status" sorter={sorter} controller={controller}/>
          </th>
          <th className="applied-sum-column">Haettu <HakemusSorter field="applied-sum" sorter={sorter} controller={controller}/></th>
          <th className="granted-sum-column">Myönnetty <HakemusSorter field="granted-sum" sorter={sorter} controller={controller}/></th>
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

class HakemusSorter extends Component {

  static determineCssClass(sorter, order) {
    return sorter && sorter.order === order ? "sorted" : ""
  }

  render() {
    const field = this.props.field
    const sorterList = this.props.sorter
    const sorter = _.find(sorterList, sorter => sorter.field === field)
    const controller = this.props.controller

    const onSorterChange = function(order) {
      return function(e) {
        console.log(field, sorterList, sorter)
        if(sorter) {
          const sorterListWithoutThis =  _.without(sorterList, sorter)
          if(sorter.order == order) {
            controller.setSorter(sorterListWithoutThis)
          }
          else {
            controller.setSorter(_.union(sorterListWithoutThis, [{field: field, order: order}]))
          }
        }
        else {
          controller.setSorter(_.union(sorterList, [{field: field, order: order}]))
        }
      }
    }
    return (
      <div className="sorter">
        <a onClick={onSorterChange("desc")} className={"sort-desc " + HakemusSorter.determineCssClass(sorter, "desc")}/>
        <a onClick={onSorterChange("asc")} className={"sort-asc " + HakemusSorter.determineCssClass(sorter, "asc")}/>
      </div>
    )
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
