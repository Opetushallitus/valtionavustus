import React, { Component } from 'react'

import { BasicInfoComponent }from 'soresu-form/web/form/component/InfoElement.jsx'

import HakuStatus from "../avustushaku/HakuStatus.jsx"

import HakuRoles from "./HakuRoles.jsx"

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const ldapSearchResults = this.props.ldapSearchResults

    const onChange = e => {
      controller.onChangeListener(avustushaku, e.target, e.target.value)
    }

    return (
      <div id="haku-edit">
        <div id="haku-edit-header">
          <h2>Muokkaa avustushakua</h2>
          <CreateHaku controller={controller} avustushaku={avustushaku}/>
        </div>
        <RegisterNumber controller={controller} avustushaku={avustushaku} onChange={onChange} />
        <table id="name" className="translation">
          <thead><tr><th>Haun nimi</th><th>Haun nimi ruotsiksi</th></tr></thead>
          <tbody>
            <tr>
              <td><textarea onChange={onChange} rows="2" maxLength="200" id="haku-name-fi" value={avustushaku.content.name.fi}/></td>
              <td><textarea onChange={onChange} rows="2" maxLength="200" id="haku-name-sv" value={avustushaku.content.name.sv}/></td>
            </tr>
          </tbody>
        </table>
        <div className="haku-duration-and-self-financing">
          <div className="haku-duration-edit-container">
            <h3>{avustushaku.content.duration.label.fi}</h3>
            <DateField id="hakuaika-start" onChange={onChange} value={avustushaku.content.duration.start} disabled={avustushaku.status === "published"} />
            <span className="dateDivider" />
            <DateField id="hakuaika-end" onChange={onChange} value={avustushaku.content.duration.end} disabled={avustushaku.status === "published"} />
          </div>
          <div className="haku-self-financing-edit-container">
            <h3>Hakijan omarahoitusvaatimus</h3>
            <input  id="haku-self-financing-percentage"  type="number" min="0" max="99" className="percentage" required="true" maxLength="2"
                   onChange={onChange} disabled={avustushaku.status === "published"} value={avustushaku.content["self-financing-percentage"]} /><span>%</span>
          </div>
        </div>
        <HakuRoles avustushaku={avustushaku} ldapSearchResults={ldapSearchResults} controller={controller}/>
        <SetStatus hakuIsValid={RegisterNumber.isValid(avustushaku)} currentStatus={avustushaku.status} onChange={onChange} />
        <SelectionCriteria controller={controller} avustushaku={avustushaku} onChange={onChange} />
        <FocusArea controller={controller} avustushaku={avustushaku} onChange={onChange} />
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
    const dateStr = BasicInfoComponent.asDateString(this.props.value) + " " + BasicInfoComponent.asTimeString(this.props.value)
    this.state = {value: dateStr}
  }

  componentWillReceiveProps(nextProps) {
    if(this.props.value !== nextProps.value) {
      const dateStr = BasicInfoComponent.asDateString(nextProps.value) + " " + BasicInfoComponent.asTimeString(nextProps.value)
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
    const criteriaItems = []
    for (var index=0; index < selectionCriteria.items.length; index++) {
      const htmlId = "selection-criteria-" + index + "-"
      criteriaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "fi"} value={selectionCriteria.items[index].fi}/></td>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "sv"} value={selectionCriteria.items[index].sv}/></td>
          <td><button className="remove" onClick={controller.deleteSelectionCriteria(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={avustushaku.status === "published"} /></td>
        </tr>
      )
    }

    return (
      <table id="selection-criteria" className="translation">
        <thead><tr><th>{selectionCriteria.label.fi}</th><th>{selectionCriteria.label.sv}</th></tr></thead>
        <tbody>
        {criteriaItems}
        </tbody>
        <tfoot><tr><td><button disabled={avustushaku.status === "published"} onClick={controller.addSelectionCriteria(avustushaku)}>Lisää uusi valintaperuste</button></td></tr></tfoot>
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
    const focusAreaItems = []
    for (var index=0; index < focusAreas.items.length; index++) {
      const htmlId = "focus-area-" + index + "-"
      focusAreaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "fi"} value={focusAreas.items[index].fi}/></td>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "sv"} value={focusAreas.items[index].sv}/></td>
          <td><button className="remove" onClick={controller.deleteFocusArea(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={avustushaku.status === "published"} /></td>
        </tr>
      )
    }

    return (
      <table id="focus-areas" className="translation">
        <thead><tr><th>{focusAreas.label.fi}</th><th>{focusAreas.label.sv}</th></tr></thead>
        <tbody>
        {focusAreaItems}
        </tbody>
        <tfoot><tr><td><button disabled={avustushaku.status === "published"} onClick={controller.addFocusArea(avustushaku)}>Lisää uusi painopistealue</button></td></tr></tfoot>
      </table>
    )
  }
}

class SetStatus extends React.Component {
  render() {
    const currentStatus = this.props.currentStatus
    const onChange = this.props.onChange
    const hakuIsValid = this.props.hakuIsValid
    const statuses = []
    const statusValues = ['deleted', 'draft', 'published'];
    const isDisabled = function(status) {
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
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
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
             <input disabled={avustushaku.status === "published"} onChange={this.props.onChange} className={registerNumberClass} maxLength="128" placeholder="Esim. 340/2015" id="register-number" value={registerNumber} />
             {errorString}
           </div>
  }
}
