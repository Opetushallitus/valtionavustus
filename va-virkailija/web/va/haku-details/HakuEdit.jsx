import React, { Component } from 'react'

import DateUtil from 'soresu-form/web/form/DateUtil'

import HakuStatus from "../avustushaku/HakuStatus.jsx"

import HakuRoles from "./HakuRoles.jsx"

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const ldapSearch = this.props.ldapSearch
    const userInfo = this.props.userInfo
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const allowHakuEdits = userHasEditPrivilege && avustushaku.status !== "published"

    const onChange = e => {
      controller.onChangeListener(avustushaku, e.target, e.target.value)
    }

    return (
      <div id="haku-edit">
        <div id="haku-edit-header">
          <h2>Muokkaa avustushakua</h2>
          <CreateHaku controller={controller} avustushaku={avustushaku}/>
        </div>
        <RegisterNumber controller={controller} avustushaku={avustushaku} allowHakuEdits={allowHakuEdits} onChange={onChange} />
        <table id="name" className="translation">
          <thead><tr><th>Haun nimi</th><th>Haun nimi ruotsiksi</th></tr></thead>
          <tbody>
            <tr>
              <td><textarea onChange={onChange} rows="2" maxLength="200" id="haku-name-fi" value={avustushaku.content.name.fi}  disabled={!allowHakuEdits}/></td>
              <td><textarea onChange={onChange} rows="2" maxLength="200" id="haku-name-sv" value={avustushaku.content.name.sv}  disabled={!allowHakuEdits}/></td>
            </tr>
          </tbody>
        </table>
        <div className="haku-duration-and-self-financing">
          <div className="haku-duration-edit-container">
            <h3>{avustushaku.content.duration.label.fi}</h3>
            <DateField id="hakuaika-start" onChange={onChange} value={avustushaku.content.duration.start} disabled={!allowHakuEdits} />
            <span className="dateDivider" />
            <DateField id="hakuaika-end" onChange={onChange} value={avustushaku.content.duration.end} disabled={!allowHakuEdits} />
          </div>
          <div className="haku-self-financing-edit-container">
            <h3>Hakijan omarahoitusvaatimus</h3>
            <input  id="haku-self-financing-percentage"  type="number" min="0" max="99" className="percentage" required="true" maxLength="2"
                   onChange={onChange} disabled={!allowHakuEdits} value={avustushaku.content["self-financing-percentage"]} /><span>%</span>
          </div>
        </div>
        <HakuRoles avustushaku={avustushaku} ldapSearch={ldapSearch} userInfo={userInfo} userHasEditPrivilege={userHasEditPrivilege} controller={controller} />
        <SetStatus hakuIsValid={RegisterNumber.isValid(avustushaku)} currentStatus={avustushaku.status} userHasEditPrivilege={userHasEditPrivilege} onChange={onChange} />
        <SelectionCriteria controller={controller} avustushaku={avustushaku} allowHakuEdits={allowHakuEdits} onChange={onChange} />
        <FocusArea controller={controller} avustushaku={avustushaku} allowHakuEdits={allowHakuEdits} onChange={onChange} />
      </div>
    )
  }
}

class CreateHaku extends React.Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    function onClick(e) {
      controller.createHaku(avustushaku)
      e.target.blur()
      e.preventDefault()
    }
    return <a id="create-haku" onClick={onClick}>Kopioi uuden pohjaksi</a>
  }
}

class DateField extends React.Component {
  constructor(props) {
    super(props)
    this.handleChange = this.handleChange.bind(this)
    const dateStr = DateUtil.asDateString(this.props.value) + " " + DateUtil.asTimeString(this.props.value)
    this.state = {value: dateStr}
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.value !== nextProps.value) {
      const dateStr = DateUtil.asDateString(nextProps.value) + " " + DateUtil.asTimeString(nextProps.value)
      this.setState({value: dateStr})
    }
  }

  handleChange(event) {
    this.setState({value: event.target.value})
  }

  render() {
    const id = this.props.id
    const onChange = this.props.onChange
    const disabled = this.props.disabled
    const value = this.state.value
    return <input className="date" maxLength="16" size="16" type="text" id={id} onChange={this.handleChange} onBlur={onChange} value={value} disabled={disabled}/>
  }
}

class SelectionCriteria extends React.Component {
  render() {
    const avustushaku = this.props.avustushaku
    const selectionCriteria = avustushaku.content['selection-criteria']
    const controller = this.props.controller
    const onChange = this.props.onChange
    const allowHakuEdits = this.props.allowHakuEdits
    const criteriaItems = []
    for (var index=0; index < selectionCriteria.items.length; index++) {
      const htmlId = "selection-criteria-" + index + "-"
      criteriaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "fi"} value={selectionCriteria.items[index].fi}/></td>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "sv"} value={selectionCriteria.items[index].sv}/></td>
          <td><button className="remove" onClick={controller.deleteSelectionCriteria(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={!allowHakuEdits} /></td>
        </tr>
      )
    }

    return (
      <table id="selection-criteria" className="translation">
        <thead><tr><th>{selectionCriteria.label.fi}</th><th>{selectionCriteria.label.sv}</th></tr></thead>
        <tbody>
        {criteriaItems}
        </tbody>
        <tfoot><tr><td><button disabled={!allowHakuEdits} onClick={controller.addSelectionCriteria(avustushaku)}>Lisää uusi valintaperuste</button></td></tr></tfoot>
      </table>
    )
  }
}

class FocusArea extends React.Component {
  render() {
    const avustushaku = this.props.avustushaku
    const focusAreas = avustushaku.content['focus-areas']
    const controller = this.props.controller
    const onChange = this.props.onChange
    const allowHakuEdits = this.props.allowHakuEdits
    const focusAreaItems = []
    for (var index=0; index < focusAreas.items.length; index++) {
      const htmlId = "focus-area-" + index + "-"
      focusAreaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "fi"} value={focusAreas.items[index].fi}/></td>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "sv"} value={focusAreas.items[index].sv}/></td>
          <td><button className="remove" onClick={controller.deleteFocusArea(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={!allowHakuEdits} /></td>
        </tr>
      )
    }

    return (
      <table id="focus-areas" className="translation">
        <thead><tr><th>{focusAreas.label.fi}</th><th>{focusAreas.label.sv}</th></tr></thead>
        <tbody>
        {focusAreaItems}
        </tbody>
        <tfoot><tr><td><button disabled={!allowHakuEdits} onClick={controller.addFocusArea(avustushaku)}>Lisää uusi painopistealue</button></td></tr></tfoot>
      </table>
    )
  }
}

class SetStatus extends React.Component {
  render() {
    const currentStatus = this.props.currentStatus
    const onChange = this.props.onChange
    const hakuIsValid = this.props.hakuIsValid
    const userHasEditPrivilege = this.props.userHasEditPrivilege
    const statuses = []
    const statusValues = ['deleted', 'draft', 'published'];
    const isDisabled = function(status) {
      if (!userHasEditPrivilege) {
        return true
      }
      if(status === 'deleted' && currentStatus === 'published') {
        return true
      }
      if(status === 'published' && !hakuIsValid) {
        return true
      }
      return false
    }
    for (var i=0; i < statusValues.length; i++) {
      const status = statusValues[i]
      const htmlId = "set-status-" + status
      statuses.push(
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="status"
               value={status}
               onChange={onChange}
               checked={status === currentStatus ? true: null}
               disabled={isDisabled(status)}
            />
      )
      statuses.push(
        <label key={htmlId + "-label"}
               htmlFor={htmlId}>
          <HakuStatus status={statusValues[i]}/>
        </label>
      )
    }

    return (
      <div>
        <h3>Tila</h3>
        {statuses}
      </div>
    )
  }
}

class RegisterNumber extends React.Component {

  static isValid(avustushaku) {
    const registerNumber = avustushaku["register-number"]
    return registerNumber == null ? false : /^\d{1,5}\/\d{2,6}$/.test(registerNumber)
  }

  render() {
    const avustushaku = this.props.avustushaku
    const allowHakuEdits = this.props.allowHakuEdits
    const registerNumber = avustushaku["register-number"]

    const isRegisterNumberValid = RegisterNumber.isValid(avustushaku)
    const registerNumberClass = isRegisterNumberValid ? "" : "error"
    const errorStyle = {paddingLeft: "5px"}
    var errorString = ""
    if (_.isNull(registerNumber) || _.isEmpty(registerNumber)) {
      errorString = <span style={errorStyle} className="error">Diaarinumero on pakollinen tieto</span>
    } else if (!isRegisterNumberValid) {
      errorString = <span style={errorStyle} className="error">
                      Diaarinumero ei ole oikean muotoinen (esim. 340/2015)
                    </span>
    }
    return <div>
             <h3 className="required">Diaarinumero</h3>
             <input type="text" disabled={!allowHakuEdits} onChange={this.props.onChange} className={registerNumberClass} maxLength="128" placeholder="Esim. 340/2015" id="register-number" value={registerNumber} />
             {errorString}
           </div>
  }
}
