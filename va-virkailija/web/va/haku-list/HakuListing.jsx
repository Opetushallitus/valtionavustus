import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/form/DateUtil'

import HakuStatus from '../avustushaku/HakuStatus.jsx'
import HakuPhase from '../avustushaku/HakuPhase.jsx'
import HakuStatuses from '../haku-details/HakuStatuses.js'
import HakuPhases from '../haku-details/HakuPhases'
import HakemusListing from '../hakemus-list/HakemusListing.jsx'

export default class HakuListing extends Component {

  static _fieldGetter(fieldName) {
    switch(fieldName) {
      case "phase":
        return haku => haku.phase
      case "status":
        return haku => haku.status
      case "avustushaku":
        return haku => haku.content.name.fi

    }
    throw Error("No field getter for " + fieldName)
  }

  render() {
    const {hakuList, selectedHaku, controller, filter} = this.props

    const onFilterChange = function(filterId) {
      return (e) => {
        controller.setFilter(filterId, e.target.value)
      }
    }

    const filteredHakuList = _
      .filter(hakuList, HakemusListing._filterWithArrayPredicate(HakuListing._fieldGetter("status"), filter.status))
      .filter(HakemusListing._filterWithArrayPredicate(HakuListing._fieldGetter("phase"), filter.phase))
      .filter(HakemusListing._filterWithStrPredicate(HakuListing._fieldGetter("avustushaku"), filter.avustushaku))

    const hakuElements = _.map(filteredHakuList, haku => {
      return <HakuRow haku={haku} key={haku.id} selectedHaku={selectedHaku} controller={controller}/> })
    return (
      <div className="section-container">
        <table key="hakuListing" className="haku-list overview-list">
          <thead><tr>
            <th className="name-column">
              <input className="text-filter" style={{width:300}} placeholder="Avustushaku" onChange={onFilterChange("avustushaku")} value={filter.avustushaku}></input>
            </th>
            <th className="status-column">
              <StatusFilter controller={controller}
                            hakuList={hakuList}
                            filter={filter}
                            label="Tila"
                            statusValues={HakuStatuses.allStatuses()}
                            statusToFi={HakuStatuses.statusToFI}
                            filterField="status"/>
            </th>
            <th className="phase-column">
              <StatusFilter controller={controller}
                            hakuList={hakuList}
                            filter={filter}
                            label="Vaihe"
                            statusValues={HakuPhases.allStatuses()}
                            statusToFi={HakuPhases.statusToFI}
                            filterField="phase"/>

            </th>
            <th className="start-column">Haku alkaa</th>
            <th className="end-column">Haku päättyy</th>
          </tr></thead>
          <tbody className="has-selected">
            {hakuElements}
          </tbody>
        </table>
        <p style={{fontSize:13}}>{filteredHakuList.length}/{hakuList.length} {} hakua</p>
      </div>
    )
  }
}

class HakuRow extends Component {

  toDateStr(dateTime) {
    return DateUtil.asDateString(dateTime) + ' ' + DateUtil.asTimeString(dateTime)
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
    const {controller, hakuList,filter, label,statusValues,statusToFi,filterField} = this.props
    const statusFilter = filter[filterField]
    const statuses = []
    const onCheckboxChange = function(status) {
      return function(e) {
        if(_.contains(statusFilter, status)) {
          controller.setFilter(filterField,  _.without(statusFilter, status))
        }
        else {
          controller.setFilter(filterField, _.union(statusFilter, [status]))
        }
      }
    }

    const self = this
    const onDelete = function(e) {
      self.setState({
        open: false
      })
      controller.setFilter(filterField, statusValues)
    }
    const hasFilters = statusFilter.length !== statusValues.length

    for (var i=0; i < statusValues.length; i++) {
      const status = statusValues[i]
      const checked = _.contains(statusFilter, status)
      const htmlId = "filter-by-status-" + status
      const kpl = _.filter(hakuList, HakemusListing._filterWithArrayPredicate(HakuListing._fieldGetter(filterField), [status])).length
      statuses.push(
        <div key={status}>
          <input id={htmlId} type="checkbox" checked={checked} onChange={onCheckboxChange(status)} value={statusValues[status]}/>
          <label htmlFor={htmlId}>{statusToFi(status)} ({kpl})</label>
        </div>
      )
    }
    return (
      <div className="status-filter">
        <a onClick={this.handleClick}>{label}</a>
        <button type="button" hidden={!hasFilters} onClick={onDelete} className="filter-remove" alt="Poista tila rajaukset" title="Poista tila rajaukset" tabIndex="-1" />
        <div className="status-filter-popup popup-box-shadow" hidden={!this.state.open}>
             {statuses}
        </div>
      </div>
    )
  }
}

