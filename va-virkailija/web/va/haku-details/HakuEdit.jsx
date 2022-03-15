import React, { Component } from 'react'
import _ from 'lodash'

import DateUtil from 'soresu-form/web/DateUtil'

import HakuStatus from "../avustushaku/HakuStatus.tsx"
import HakuRoles from "./HakuRoles.jsx"
import EducationLevels from "./EducationLevels.jsx"
import AutoCompleteCodeValue from "./AutoCompleteCodeValue.tsx"
import HelpTooltip from '../HelpTooltip'
import WarningBanner from "../WarningBanner";

export default class HakuEdit extends Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const hasNoPayments = avustushaku.payments &&
          avustushaku.payments.length === 0
    const vaUserSearch = this.props.vaUserSearch
    const userInfo = this.props.userInfo
    const userHasEditPrivilege = avustushaku.privileges && avustushaku.privileges["edit-haku"]
    const allowAllHakuEdits = userHasEditPrivilege && (avustushaku.status === "new" || avustushaku.status === "draft")
    const allowNondisruptiveHakuEdits = userHasEditPrivilege && (allowAllHakuEdits || avustushaku.phase === "current" || avustushaku.phase === "upcoming")
    const userHasEditMyHakuRolePrivilege = avustushaku.privileges && avustushaku.privileges["edit-my-haku-role"]
    const selectedValueProject = this.props.codeOptions.filter(k => k.id===avustushaku["project-id"])[0] || ""
    const selectedValueOperation = this.props.codeOptions.filter(k => k.id===avustushaku["operation-id"])[0] || ""
    const selectedValueOperationalUnit = this.props.codeOptions.filter(k => k.id===avustushaku["operational-unit-id"])[0] || ""
    const helpTexts = this.props.helpTexts

    const onChangeListener = (target, value) => {
      controller.onChangeListener(avustushaku, target, value)
    }

    const onChange = e => {
      onChangeListener(e.target, e.target.value)
    }

    const onChangeTrimWs = e => {
      onChangeListener(e.target, e.target.value.replace(/\s/g, " "))
    }

    const mainHelp = { __html: helpTexts["hakujen_hallinta__haun_tiedot___ohje"] }

    return (
      <div id="haku-edit">
        <div dangerouslySetInnerHTML={mainHelp}></div>
        {!avustushaku.muutoshakukelpoinen &&
          <WarningBanner>
            <div data-test-id="muutoshakukelvoton-warning">
              <p><b>Huom.!</b> Uusi muutoshakutoiminnallisuus ei ole käytössä tälle avustushaulle.</p>
              <ul>
                <li>Avustushaun päätöksiin ei tule linkkiä uudelle muutoshakusivulle</li>
              </ul>
            </div>
          </WarningBanner>}
        <div id="haku-edit-header" className="editor-header">
          <div className="field-register-number">
            <RegisterNumber controller={controller} avustushaku={avustushaku}
                            allowAllHakuEdits={allowAllHakuEdits} onChange={onChange} helpTexts={helpTexts}/>
          </div>
         <div className="editor-header-element">
           <CreateHaku controller={controller} avustushaku={avustushaku} helpTexts={helpTexts}/>
          </div>
        </div>
        <table id="name" className="translation">
          <thead><tr><th>Haun nimi <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___haun_nimi"]} direction="left" /></th><th>Haun nimi ruotsiksi</th></tr></thead>
          <tbody>
            <tr>
              <td>
                <textarea id="haku-name-fi"
                          rows="2"
                          maxLength="200"
                          value={avustushaku.content.name.fi}
                          onChange={onChangeTrimWs}
                          disabled={!allowNondisruptiveHakuEdits}
                          />
              </td>
              <td>
                <textarea id="haku-name-sv"
                          rows="2"
                          maxLength="200"
                          value={avustushaku.content.name.sv}
                          onChange={onChangeTrimWs}
                          disabled={!allowNondisruptiveHakuEdits}
                          />
              </td>
            </tr>
          </tbody>
        </table>
        <div className="editor-field-row code-values">
          <div className="editor-row-element" data-test-id="code-value-dropdown__operational-unit">
            <h3 className="required">Toimintayksikkö <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___toimintayksikkö"]} direction="left" /></h3>
            <AutoCompleteCodeValue
              id="operational-unit-id"
              codeType="operational-unit-id"
              controller={controller}
              avustushaku={avustushaku}
              onChange={onChange}
              codeOptions={this.props.codeOptions.filter(k => k["value-type"] === "operational-unit")}
              selectedValue={selectedValueOperationalUnit} />
          </div>
          <div className="editor-row-element" data-test-id="code-value-dropdown__project">
            <h3 className="required">Projekti <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___projekti"]} /></h3>
            <AutoCompleteCodeValue
              id="project-id"
              codeType="project-id"
              controller={controller}
              avustushaku={avustushaku}
              onChange={onChange}
              codeOptions={this.props.codeOptions.filter(k => k["value-type"] === "project")}
              selectedValue={selectedValueProject} />
          </div>
          <div className="editor-row-element" data-test-id="code-value-dropdown__operation">
            <h3 className="required">Toiminto <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___toiminto"]} /></h3>
            <AutoCompleteCodeValue
              id="operation-id"
              codeType="operation-id"
              controller={controller}
              avustushaku={avustushaku}
              onChange={onChange}
              codeOptions={this.props.codeOptions.filter(k => k["value-type"] === "operation")}
              selectedValue={selectedValueOperation} />
          </div>
        </div>
        <SetStatus hakuIsValid={RegisterNumber.isValid(avustushaku)} currentStatus={avustushaku.status} userHasEditPrivilege={userHasEditPrivilege} onChange={onChange} helpTexts={helpTexts} />
        <div className="haku-duration-and-self-financing">
          <div className="haku-duration-edit-container">
            <h3>{avustushaku.content.duration.label.fi} <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___hakuaika"]} direction="left" /></h3>
            <DateField id="hakuaika-start" onBlur={onChange} avustushakuId={avustushaku.id} value={avustushaku.content.duration.start} disabled={!allowAllHakuEdits} />
            <span className="dateDivider" />
            <DateField id="hakuaika-end" onBlur={onChange} avustushakuId={avustushaku.id} value={avustushaku.content.duration.end} disabled={!allowNondisruptiveHakuEdits} />
          </div>
        </div>
        <HakuType hakuType={avustushaku["haku-type"]} disabled={!allowAllHakuEdits} onChange={onChange} helpTexts={helpTexts} />
        <AcademySize value={avustushaku.is_academysize}
                     disabled={!allowAllHakuEdits}
                     onChange={onChange}
                     helpTexts={helpTexts} />
        <EducationLevels enabled={allowNondisruptiveHakuEdits}
                         values={avustushaku.content.rahoitusalueet}
                         onAdd={controller.addTalousarviotili}
                         onRemove={controller.deleteTalousarviotili}
                         grant={avustushaku}
                         onChange={onChange}
                         helpTexts={helpTexts}/>
        <div>
          <div className="multibatch-fields">
            <h3>Maksatus <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___maksatus"]} direction="left" /></h3>
            <div>
              <div className="haku-edit-field-container">
                <Maksuerat value={avustushaku.content.multiplemaksuera}
                           disabled={!allowAllHakuEdits} onChange={onChange}/>
              </div>
              <div className="haku-edit-field-container">
                <h3>Hakijan omarahoitusvaatimus <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___hakijan_omarahoitusvaatimus"]} /></h3>
                <input id="haku-self-financing-percentage" type="number"
                       min="0" max="99" className="percentage" required={true}
                       maxLength="2" onChange={onChange}
                       disabled={!allowAllHakuEdits}
                       value={avustushaku.content["self-financing-percentage"]} />
                <span>%</span>
              </div>
            </div>
            <div title={avustushaku.content.multiplemaksuera &&
                        allowAllHakuEdits && !hasNoPayments ?
                        "Avustuksen maksatuksia on jo luotu, joten arvoja ei voi enää muuttaa"
                        : null}>
              <div
                className={
                  avustushaku.content.multiplemaksuera && allowAllHakuEdits &&
                    hasNoPayments ?
                null : "haku-edit-disabled-form"}>
                <div>
                  <label className="haku-edit-radio-button-item">
                    <input type="radio" name="payment-size-limit" value="no-limit"
                           checked={avustushaku.content["payment-size-limit"] === "no-limit"}
                           className="haku-edit-radio-button" onChange={onChange}
                           id="payment-size-limit-1"/>
                    Kaikille avustuksen saajille maksetaan useammassa erässä
                  </label>
                  <label className="haku-edit-radio-button-item">
                    <input type="radio" name="payment-size-limit" value="fixed-limit"
                           checked={avustushaku.content["payment-size-limit"] === "fixed-limit"}
                           className="haku-edit-radio-button" onChange={onChange}
                           id="payment-size-limit-2"/>
                    Maksetaan useammassa erässä, kun OPH:n avustus hankkeelle (ts. maksettava kokonaissumma) on vähintään
                    <input className="haku-edit-inline-input" type="number"
                           id="payment-fixed-limit"
                           disabled={avustushaku.content["payment-size-limit"] !== "fixed-limit"}
                           onChange={onChange}
                           value={avustushaku.content["payment-fixed-limit"] || ""} />
                    <span>€</span>
                  </label>
                </div>
                <div className="haku-edit-subrow">
                  <label className="haku-edit-field-label">
                    Ensimmäisen erän osuus OPH:n avustuksesta hankkeelle (ts. maksettava kokonaissumma) on vähintään
                    <input type="number" className="haku-edit-inline-input"
                           id="payment-min-first-batch"
                           onChange={onChange}
                           value={avustushaku.content["payment-min-first-batch"] || ""}/>
                    <span>%</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="payments-fields">
              <div className="haku-edit-field-container">
                <label>
                  <h3>Maksuliikemenotili <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___maksuliikennemenotili"]} direction="left" /></h3>
                  <select id="transaction-account"
                          onChange={onChange}
                          name="transaction-account"
                          value={avustushaku.content["transaction-account"] || ""}>
                    <option value=""></option>
                    <option value="5000">5000</option>
                    <option value="5220">5220</option>
                    <option value="5230">5230</option>
                    <option value="5240">5240</option>
                    <option value="5250">5250</option>
                  </select>
                </label>
              </div>
              <div className="haku-edit-field-container">
                <label>
                  <h3>Tositelaji <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___tositelaji"]} /></h3>
                  <select id="document-type"
                          onChange={onChange}
                          name="document-type"
                          value={avustushaku.content["document-type"] || ""}>
                    <option value=""></option>
                    <option value="XE">XE</option>
                    <option value="XB">XB</option>
                  </select>
                </label>
              </div>
            </div>
          </div>
          <div className="editor-field-row">
            <div className="editor-row-element">
              <h3 className="required">Määräraha <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___määräraha"]} direction="left" /></h3>
              <input id="total-grant-size" type="number"
                     disabled={!allowAllHakuEdits} onChange={onChange}
                     required={true}
                     value={avustushaku.content["total-grant-size"] || ""}/>
              <span> €</span>
            </div>
          </div>
        </div>
        <HakuRoles avustushaku={avustushaku} vaUserSearch={vaUserSearch} userInfo={userInfo} userHasEditPrivilege={userHasEditPrivilege} userHasEditMyHakuRolePrivilege={userHasEditMyHakuRolePrivilege} controller={controller} helpTexts={helpTexts}/>
        <SelectionCriteria controller={controller} avustushaku={avustushaku} allowAllHakuEdits={allowAllHakuEdits} allowNondisruptiveHakuEdits={allowNondisruptiveHakuEdits} onChange={onChange} helpTexts={helpTexts}/>
        <FocusArea controller={controller} avustushaku={avustushaku} allowAllHakuEdits={allowAllHakuEdits} allowNondisruptiveHakuEdits={allowNondisruptiveHakuEdits} onChange={onChange} helpTexts={helpTexts}/>
      </div>
    )
  }
}

class CreateHaku extends React.Component {
  render() {
    const controller = this.props.controller
    const avustushaku = this.props.avustushaku
    const helpTexts = this.props.helpTexts
    function onClick(e) {
      controller.createHaku(avustushaku)
      e.target.blur()
      e.preventDefault()
    }
    return <span><a id="create-haku" onClick={onClick}>Kopioi uuden pohjaksi</a><HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___kopioi_uuden_pohjaksi"]} direction="right" /></span>
  }
}

class DateField extends React.Component {
  constructor(props) {
    super(props)
    this.state = DateField.initialState(props)
    this.onChange = this.onChange.bind(this)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.avustushakuId !== state.currentAvustushakuId) {
      return DateField.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentAvustushakuId: props.avustushakuId,
      value: DateField.asDateTimeString(props.value)
    }
  }

  onChange(event) {
    this.setState({value: event.target.value})
  }

  render() {
    return (
      <input className="date"
             maxLength="16"
             size="16"
             type="text"
             id={this.props.id}
             onChange={this.onChange}
             onBlur={this.props.onBlur}
             value={this.state.value}
             disabled={this.props.disabled}/>
    )
  }

  static asDateTimeString(value) {
    return DateUtil.asDateString(value) + " " + DateUtil.asTimeString(value)
  }
}

class SelectionCriteria extends React.Component {
  render() {
    const avustushaku = this.props.avustushaku
    const selectionCriteria = avustushaku.content['selection-criteria']
    const controller = this.props.controller
    const onChange = this.props.onChange
    const allowAllHakuEdits = this.props.allowAllHakuEdits
    const allowNondisruptiveHakuEdits = this.props.allowNondisruptiveHakuEdits
    const criteriaItems = []
    const helpTexts = this.props.helpTexts
    for (let index = 0; index < selectionCriteria.items.length; index++) {
      const htmlId = "selection-criteria-" + index + "-"
      criteriaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "fi"} value={selectionCriteria.items[index].fi} disabled={!allowNondisruptiveHakuEdits} /></td>
          <td><textarea onChange={onChange} rows="2" id={htmlId + "sv"} value={selectionCriteria.items[index].sv} disabled={!allowNondisruptiveHakuEdits} /></td>
          <td><button type="button" className="remove" onClick={controller.deleteSelectionCriteria(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={!allowAllHakuEdits} /></td>
        </tr>
      )
    }

    return (
      <table id="selection-criteria" className="translation">
        <thead><tr><th>{selectionCriteria.label.fi} <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___valintaperusteet"]} direction="left" /></th><th>{selectionCriteria.label.sv}</th></tr></thead>
        <tbody>
        {criteriaItems}
        </tbody>
        <tfoot><tr><td><button type="button" disabled={!allowAllHakuEdits} onClick={controller.addSelectionCriteria(avustushaku)}>Lisää uusi valintaperuste</button></td></tr></tfoot>
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
    const allowAllHakuEdits = this.props.allowAllHakuEdits
    const allowNondisruptiveHakuEdits = this.props.allowNondisruptiveHakuEdits
    const helpTexts = this.props.helpTexts
    const focusAreaItems = []
    for (let index = 0; index < focusAreas.items.length; index++) {
      const htmlId = "focus-area-" + index + "-"
      focusAreaItems.push(
        <tr key={index}>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "fi"} value={focusAreas.items[index].fi} disabled={!allowNondisruptiveHakuEdits} /></td>
          <td><textarea onChange={onChange} rows="3" id={htmlId + "sv"} value={focusAreas.items[index].sv} disabled={!allowNondisruptiveHakuEdits} /></td>
          <td><button type="button" className="remove" onClick={controller.deleteFocusArea(avustushaku, index)} alt="Poista" title="Poista" tabIndex="-1" disabled={!allowAllHakuEdits} /></td>
        </tr>
      )
    }

    return (
      <table id="focus-areas" className="translation">
        <thead><tr><th>{focusAreas.label.fi} <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___painopistealueet"]} direction="left" /></th><th>{focusAreas.label.sv}</th></tr></thead>
        <tbody>
        {focusAreaItems}
        </tbody>
        <tfoot><tr><td><button type="button" disabled={!allowAllHakuEdits} onClick={controller.addFocusArea(avustushaku)}>Lisää uusi painopistealue</button></td></tr></tfoot>
      </table>
    )
  }
}

class HakuType extends React.Component {
  render() {
    const selectedHakuType = this.props.hakuType
    const isDisabled = this.props.disabled
    const onChange = this.props.onChange
    const helpTexts = this.props.helpTexts
    const options = _.flatten([
      {htmlId: "set-haku-type-yleisavustus", value: "yleisavustus", label: "Yleisavustus"},
      {htmlId: "set-haku-type-eritysavustus", value: "erityisavustus", label: "Erityisavustus"}
    ].map(spec =>
      [
        <input id={spec.htmlId}
               key={spec.htmlId}
               type="radio"
               name="haku-type"
               value={spec.value}
               onChange={onChange}
               checked={spec.value === selectedHakuType}
               disabled={isDisabled} />,
        <label key={spec.htmlId + "-label"}
               htmlFor={spec.htmlId}>{spec.label}</label>
      ]
    ))
    return (
      <div id="set-haku-type">
        <h3>Hakutyyppi <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___hakutyyppi"]} direction="left" /></h3>
        <fieldset className="soresu-radiobutton-group">
          {options}
        </fieldset>
      </div>
    )
  }
}

class AcademySize extends React.Component {
  render() {
    const initialValue = this.props.value === true
    const onChange = this.props.onChange
    const isDisabled = this.props.disabled
    const options = []
    const values = [false, true]
    const helpTexts = this.props.helpTexts
    for (let i=0; i < values.length; i++) {
      const value = values[i]
      const htmlId = "set-is_academysize-" + value
      options.push(
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="is_academysize"
               value={value}
               onChange={onChange}
               checked={value === initialValue}
               disabled={isDisabled}
        />
      )
      options.push(
        <label key={htmlId + "-label"} htmlFor={htmlId}>{value ? "Valmistelija lisää oppilaitoksen koon" : "Ei käytössä"}</label>
      )
    }
    return (
      <div id="set-academysize">
        <h3>Oppilaitoksen koko <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___oppilaitoksen_koko"]} direction="left" /></h3>
        <fieldset className="soresu-radiobutton-group">
          {options}
        </fieldset>
      </div>
    )
  }
}


class Maksuerat extends React.Component {
  render() {
    const multipleRahoitusalue = this.props.value === true
    const onChange = this.props.onChange
    const isDisabled = this.props.disabled
    const options = [
      {label:"Yksi maksuerä",value:false},
      {label:"Useampi maksuerä",value:true}
    ]
    const optionsHtml = options.map(option=>{
      const value = option.value
      const htmlId = "set-maksuera-" + value
      return (
      <span key={value}>
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="maksuera"
               value={value}
               onChange={onChange}
               checked={value === multipleRahoitusalue}
               disabled={isDisabled}
        />
        <label key={htmlId + "-label"} htmlFor={htmlId}>
          {option.label}
        </label>
      </span>
    )})

    return (
      <div id="set-maksuerat">
        <fieldset className="soresu-radiobutton-group">
          {optionsHtml}
        </fieldset>
      </div>
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
    const statusValues = ['deleted', 'draft', 'published', 'resolved']
    const helpTexts = this.props.helpTexts
    const isDisabled = function(status) {
      if (!userHasEditPrivilege) {
        return true
      }
      if(status === 'deleted' && currentStatus !== 'draft') {
        return true
      }
      if(status === 'draft' && currentStatus === 'resolved') {
        return true
      }
      if(status === 'published' && !hakuIsValid) {
        return true
      }
      if(status === 'resolved' && currentStatus !== 'published') {
        return true
      }
      return false
    }
    for (let i = 0; i < statusValues.length; i++) {
      const status = statusValues[i]
      const htmlId = "set-status-" + status
      statuses.push(
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="status"
               value={status}
               onChange={onChange}
               checked={status === currentStatus}
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
        <h3>Tila <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___tila"]} direction="left" /></h3>
        <fieldset className="soresu-radiobutton-group">
          {statuses}
        </fieldset>
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
    const allowAllHakuEdits = this.props.allowAllHakuEdits
    const registerNumber = avustushaku["register-number"] || ""

    const isRegisterNumberValid = RegisterNumber.isValid(avustushaku)
    const registerNumberClass = isRegisterNumberValid ? "" : "error"
    const errorStyle = {paddingLeft: "5px"}
    const helpTexts = this.props.helpTexts
    let errorString = ""
    if (_.isNull(registerNumber) || _.isEmpty(registerNumber)) {
      errorString = <span style={errorStyle} className="error">Asianumero on pakollinen tieto</span>
    } else if (!isRegisterNumberValid) {
      errorString = <span style={errorStyle} className="error">
                      Asianumero ei ole oikean muotoinen (esim. 340/2015)
                    </span>
    }
    return <div className="haku-edit-registernumber">
             <h3 className="required">Asianumero <HelpTooltip content={helpTexts["hakujen_hallinta__haun_tiedot___asianumero"]} direction="left" /></h3>
             <input type="text" disabled={!allowAllHakuEdits} onChange={this.props.onChange} className={registerNumberClass} maxLength="128" placeholder="Esim. 340/2015" id="register-number" value={registerNumber} />
             <div>{errorString}</div>
           </div>
  }
}
