import React, { Component } from 'react'
import _ from 'lodash'
import moment from 'moment'

import DateUtil from 'soresu-form/web/DateUtil'

import HakuStatus from '../avustushaku/HakuStatus.jsx'
import HakuPhase from '../avustushaku/HakuPhase.jsx'
import HakuStatuses from '../haku-details/HakuStatuses'
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
      case "startdate":
        return haku => haku.content.duration.start
      case "enddate":
        return haku => haku.content.duration.end

    }
    throw Error("No field getter for " + fieldName)
  }

  static _filterWithDatePredicate(fieldGetter, filterStart, filterEnd) {
    if(_.isEmpty(filterStart) && _.isEmpty(filterEnd)) {
      return () => true
    }
    return function(hakemus) {
      const value = fieldGetter(hakemus)
      const filterStartDate = _.isEmpty(filterStart) ? "" : moment(filterStart, "DD.MM.YYYY")
      const filterEndDate = _.isEmpty(filterEnd) ? "" : moment(filterEnd, "DD.MM.YYYY")
      return moment(value).startOf('day').isBetween(filterStartDate, filterEndDate, null, '[]');
    }
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
      .filter(HakuListing._filterWithDatePredicate(HakuListing._fieldGetter("startdate"), filter.startdatestart,filter.startdateend))
      .filter(HakuListing._filterWithDatePredicate(HakuListing._fieldGetter("enddate"), filter.enddatestart,filter.enddateend))

    const onRemoveFilters = () => {
      controller.clearFilters()
    }

    const hasFilters =
      filter.status.length!=HakuStatuses.allStatuses().length ||
      filter.phase.length!=HakuPhases.allStatuses().length ||
      filter.avustushaku.length>0 ||
      filter.startdatestart.length>0 ||
      filter.startdateend.length>0 ||
      filter.enddatestart.length>0 ||
      filter.enddateend.length>0


    const hakuElements = _.map(filteredHakuList, haku => {
      return <HakuRow haku={haku} key={haku.id} selectedHaku={selectedHaku} controller={controller}/> })
    return (
      <div className="section-container">
        <table key="hakuListing" className="haku-list overview-list">
          <thead><tr>
            <th className="name-column">
              <input className="text-filter" style={{width:300}} placeholder="Avustushaku" onChange={onFilterChange("avustushaku")} value={filter.avustushaku}></input>
              {hasFilters && <a className="haku-filter-remove" onClick={onRemoveFilters}>Poista rajaimet</a>}
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
            <th className="start-column">
              <DateFilter controller={controller}
                            filter={filter}
                            label="Haku alkaa"
                            filterField="startdate"/>



            </th>
            <th className="end-column">
              <DateFilter controller={controller}
                          filter={filter}
                          label="Haku päättyy"
                          filterField="enddate"/>
            </th>
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
        <button type="button" hidden={!hasFilters} onClick={onDelete} className="filter-remove" alt="Poista tilojen rajaukset" title="Poista tilojen rajaukset" tabIndex="-1" />
        <div className="status-filter-popup popup-box-shadow" hidden={!this.state.open}>
             {statuses}
        </div>
      </div>
    )
  }
}

class DateFilter extends Component {
  constructor(props) {
    super(props)
    this.handleClick = this.handleClick.bind(this)
    this.render = this.render.bind(this)
    this.state = { open: false,invalidstart:false,invalidend:false }
  }

  handleClick() {
    this.setState({
      open: !this.state.open
    })
  }

  render() {
    const {controller, filter, label, filterField} = this.props

    const updateFilter = (type,event) => {
      const value = event.target.value
      const isValid = moment(value, ["D.M.YYYY"],true).isValid() || value==""
      if(isValid){
        controller.setFilter(filterField + type, value)
      }
      const stateChanges = {start:undefined,end:undefined}
      stateChanges[`invalid${type}`] = !isValid
      this.setState(stateChanges)
    }

    const startValue = this.state["start"] || filter[filterField + "start"]
    const endValue = this.state["end"] || filter[filterField + "end"]

    const onChange = (type,event) => {
      const newState = {}
      newState[type] = event.target.value
      this.setState(newState)
    }

    return (
      <div className="status-filter">
        <a onClick={this.handleClick}>{label}</a>
        <div className="status-filter-popup popup-box-shadow" hidden={!this.state.open}>
             <label>Alkaen</label>
             <input type="text" onBlur={_.partial(updateFilter,'start')} onChange={_.partial(onChange,'start')} className={this.state.invalidstart ? 'error' : ''} placeholder="p.k.vvvv" value={startValue}/>
             <label>Loppuu</label>
          <input type="text" onBlur={_.partial(updateFilter,'end')} onChange={_.partial(onChange,'end')} className={this.state.invalidend ? 'error' : ''}  placeholder="p.k.vvvv" value={endValue}/>
        </div>
      </div>
    )
  }
}

