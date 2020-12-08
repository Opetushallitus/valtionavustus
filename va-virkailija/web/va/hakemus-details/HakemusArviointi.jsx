import _ from 'lodash'
import React, { Component } from 'react'
import Bacon from 'baconjs'

import HttpUtil from 'soresu-form/web/HttpUtil'
import DateUtil from 'soresu-form/web/DateUtil'

import HakemusBudgetEditing from '../budgetedit/HakemusBudgetEditing.jsx'

import HakemusScoring from './HakemusScoring.jsx'
import HakemusComments from './HakemusComments.jsx'
import HakemusArviointiStatuses from "./HakemusArviointiStatuses"
import TraineeDayEditing from '../traineeday/TraineeDayEditing.jsx'
import ChooseRahoitusalueAndTalousarviotili from './ChooseRahoitusalueAndTalousarviotili.jsx'
import SpecifyOppilaitos from './SpecifyOppilaitos.jsx'
import AcademySize from './AcademySize.jsx'
import Perustelut from './Perustelut.jsx'
import PresenterComment from './PresenterComment.jsx'
import EditStatus from './EditStatus.jsx'
import ReSendDecisionEmail from './ReSendDecisionEmail.jsx'
import ApplicationPayments from './ApplicationPayments.jsx'
import HelpTooltip from '../HelpTooltip.jsx'

import '../style/admin.less'

export default class HakemusArviointi extends Component {
  render() {
    const {controller, hakemus, avustushaku, hakuData, translations,
           userInfo, loadingComments, showOthersScores,
           multibatchEnabled, helpTexts} = this.props
    const {
      allowHakemusCommenting,
      allowHakemusStateChanges,
      allowHakemusScoring,
      allowHakemusOfficerEditing,
      allowHakemusCancellation
    } = this.props.selectedHakemusAccessControl
    const comments = hakemus.comments

    return (
     <div id="arviointi-tab">
       <PresenterComment controller={controller} hakemus={hakemus} helpText={helpTexts["hankkeen_sivu__arviointi___valmistelijan_huomiot"]}/>
       <ChooseRahoitusalueAndTalousarviotili controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       <SpecifyOppilaitos controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges}/>
       <AcademySize controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges}/>
       <HakemusScoring controller={controller} hakemus={hakemus} avustushaku={avustushaku} helpTexts={helpTexts}
                       allowHakemusScoring={allowHakemusScoring} userInfo={userInfo} showOthersScores={showOthersScores}/>
       <HakemusComments
         controller={controller}
         hakemus={hakemus}
         comments={comments}
         loadingComments={loadingComments}
         allowHakemusCommenting={allowHakemusCommenting}
         user={userInfo}
         helpTexts={helpTexts}
         grantState={avustushaku.status}/>
       <SetArviointiStatus controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       <Perustelut controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       <ChangeRequest controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       <SummaryComment controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       <HakemusBudgetEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} helpTexts={helpTexts} />
       {multibatchEnabled && avustushaku.content["multiplemaksuera"] &&
         <ApplicationPayments application={hakemus}
                              grant={avustushaku}
                              index={0}
                              payments={hakemus.payments}
                              onAddPayment={controller.addPayment}
                              onRemovePayment={controller.removePayment}
                              readonly={true}/>}
       <TraineeDayEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}  allowEditing={allowHakemusStateChanges} />
       <EditStatus avustushaku={avustushaku} hakemus={hakemus} allowEditing={allowHakemusOfficerEditing} status="officer_edit" helpTexts={helpTexts} />
       <EditStatus avustushaku={avustushaku} hakemus={hakemus} allowEditing={allowHakemusCancellation} status="cancelled" helpTexts={helpTexts} />
       <ReSendDecisionEmail  avustushaku={avustushaku} hakemus={hakemus} hakuData={hakuData} helpTexts={helpTexts} />
       <ChangeLog hakemus={hakemus}/>
     </div>
    )
  }
}

class ChangeLog extends React.Component{
  render(){
    const hakemus = this.props.hakemus
    const changelogs = _.get(this.props.hakemus, "arvio.changelog")
    if (!changelogs) {
      return null
    }
    return (
      <div className="changelog">
        <h2 className="changelog__heading">Muutoshistoria</h2>
        {changelogs.length ? (
          <table className="changelog__table">
            {changelogs.map((changelog, index) => <ChangeLogRow key={index} changelog={changelog} hakemus={hakemus}/>)}
          </table>
        ) : (
          <div>Ei muutoksia</div>
        )}
      </div>
    )
  }
}

class ChangeLogRow extends React.Component{
  constructor(props){
    super(props)
    this.state = ChangeLogRow.initialState(props)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return ChangeLogRow.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentHakemusId: props.hakemus.id,
      open:false
    }
  }

  render(){
    const changelog = this.props.changelog
    const types = {
      "budget-change": "Budjetti päivitetty",
      "oppilaitokset-change": "Oppilaitokset päivitetty",
      "summary-comment": "Perustelut hakijalle",
      "overridden-answers-change": "Sisältöä päivitetty",
      "presenter-comment": "Valmistelijan huomiot päivitetty",
      "status-change": "Tila päivitetty",
      "should-pay-change" : "Maksuun kyllä/ei päivitetty"
    }
    const typeTranslated = types[changelog.type] || changelog.type
    const dateStr = DateUtil.asDateString(changelog.timestamp) + " " + DateUtil.asTimeString(changelog.timestamp)

    const toggleOpen = ()=> {
      this.setState({open:!this.state.open})
    }

    return (
      <tbody>
        <tr className="changelog__row">
          <td className="changelog__date">{dateStr}</td>
          <td className="changelog__name">{changelog["first-name"]} {changelog["last-name"]}</td>
          <td className="changelog__type"><a onClick={toggleOpen}>{typeTranslated}</a></td>
        </tr>
        <tr>
          {this.state.open && (
           <td colSpan="3">
             <pre className="changelog__data">{JSON.stringify(changelog.data)}</pre>
           </td>
          )}
        </tr>
      </tbody>
    )
  }
}

class SetArviointiStatus extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const arvio = hakemus.arvio
    const status = arvio ? arvio.status : undefined
    const controller = this.props.controller
    const helpTexts = this.props.helpTexts
    const statuses = []
    const statusValues = HakemusArviointiStatuses.allStatuses()
    for (let i = 0; i < statusValues.length; i++) {
      const htmlId = "set-arvio-status-" + statusValues[i]
      const statusFI = HakemusArviointiStatuses.statusToFI(statusValues[i])
      const onChange = allowEditing ? controller.setHakemusArvioStatus(hakemus, statusValues[i]) : null
      statuses.push(
        <input id={htmlId}
               type="radio"
               key={htmlId}
               name="status"
               value={statusValues[i]}
               disabled={!allowEditing}
               onChange={onChange}
               checked={statusValues[i] === status}
            />
      )
      statuses.push(
        <label key={htmlId + "-label"} htmlFor={htmlId}>{statusFI}</label>
      )
    }

    return (
      <div className="hakemus-arviointi-section">
        <label>Hakemuksen tila:</label>
        <HelpTooltip testId={"tooltip-tila"} content={helpTexts["hankkeen_sivu__arviointi___hakemuksen_tila"]} direction={"arviointi"} />
        <fieldset className="soresu-radiobutton-group">
          {statuses}
        </fieldset>
      </div>
    )
  }
}


class ChangeRequest extends React.Component {

  constructor(props){
    super(props)
    this.state = ChangeRequest.initialState(props)
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hakemus.id !== state.currentHakemusuId) {
      return ChangeRequest.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentHakemusId: props.hakemus.id,
      preview: false
    }
  }

  render() {
    const helpTexts = this.props.helpTexts
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const status = hakemus.status
    const hasChangeRequired = status === 'pending_change_request' || status === 'officer_edit'
    const changeRequestTitle = status === 'pending_change_request' ? "Täydennyspyyntö lähetetty" : "Virkailijan muokkaus avattu"
    const allowEditing = this.props.allowEditing
    const lastChangeRequest = _.last(hakemus.changeRequests)
    const lastChangeRequestText = lastChangeRequest ? lastChangeRequest["status-comment"] : ""
    const lastChangeRequestTime = lastChangeRequest ? DateUtil.asDateString(lastChangeRequest["version-date"]) + " " + DateUtil.asTimeString(lastChangeRequest["version-date"]) : ""
    const controller = this.props.controller
    const openEdit = allowEditing ? controller.setChangeRequestText(hakemus, "") : null
    const closeEdit = allowEditing ? controller.setChangeRequestText(hakemus, undefined) : null
    const onTextChange = function(event) {
      controller.setChangeRequestText(hakemus, event.target.value)()
    }
    const sendChangeRequest = allowEditing ? controller.setHakemusStatus(hakemus, "pending_change_request", () => hakemus.changeRequest) : null
    const newChangeRequest = typeof hakemus.changeRequest !== 'undefined' && !hasChangeRequired

    const onPreview = () =>{
      const sendS = Bacon.fromPromise(HttpUtil.post(`/api/avustushaku/${avustushaku.id}/change-request-email`,{text:hakemus.changeRequest}))
      sendS.onValue((res)=>{
        this.setState({preview:true,mail:res.mail})
      })
    }

    const closePreview = () => this.setState({preview:false})
    const mail = this.state.mail
    return (
      <div className="value-edit">
        <button type="button"
                hidden={newChangeRequest || hasChangeRequired}
                onClick={openEdit}
                disabled={!allowEditing}>Pyydä täydennystä </button>
        <HelpTooltip testId={"tooltip-taydennys"} content={helpTexts["hankkeen_sivu__arviointi___pyydä_täydennystä"]} direction="arviointi" />
        <div hidden={!newChangeRequest}>
          <label>Lähetä täydennyspyyntö</label>
          <span onClick={closeEdit} className="close"></span>
          <textarea data-test-id='täydennyspyyntö__textarea' placeholder="Täydennyspyyntö hakijalle" onChange={onTextChange} rows="4" disabled={!allowEditing} value={hakemus.changeRequest}/>
          <button data-test-id='täydennyspyyntö__lähetä' type="button" disabled={_.isEmpty(hakemus.changeRequest)} onClick={sendChangeRequest}>Lähetä</button>
          <a onClick={onPreview} style={{position:'relative'}}>Esikatsele</a>
          {this.state.preview && <div className="panel email-preview-panel">
            <span className="close" onClick={closePreview}></span>
            <strong>Otsikko:</strong> {mail.subject}<br/>
            <strong>Lähettäjä:</strong> {mail.sender}<br/><br/>
            <div style={{whiteSpace:'pre-line'}}>
            {mail.content}
            </div>
          </div>}
        </div>
        <div hidden={!hasChangeRequired}>
          <div className="change-request-title">* {changeRequestTitle} {lastChangeRequestTime}</div>
          <pre className="change-request-text">{lastChangeRequestText}</pre>
        </div>
      </div>
    )
  }
}

class SummaryComment extends React.Component {
  constructor(props) {
    super(props)
    this.state = SummaryComment.initialState(props)
    this.summaryCommentBus = new Bacon.Bus()
    this.summaryCommentBus.debounce(1000).onValue(([hakemus, newSummaryComment]) => this.props.controller.setHakemusSummaryComment(hakemus, newSummaryComment))
  }

  static getDerivedStateFromProps(props, state) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return SummaryComment.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props) {
    return {
      currentHakemusId: props.hakemus.id,
      summaryComment: SummaryComment.getSummaryComment(props.hakemus)
    }
  }

  static getSummaryComment(hakemus) {
    const arvio = hakemus.arvio ? hakemus.arvio : {}
    return arvio["summary-comment"] ||  ""
  }


  summaryCommentUpdated(newSummaryComment) {
    this.setState({summaryComment: newSummaryComment})
    this.summaryCommentBus.push([this.props.hakemus, newSummaryComment])
  }

  render() {
    const allowEditing = this.props.allowEditing
    const helpTexts = this.props.helpTexts

    return <div className="value-edit summary-comment">
      <label htmlFor="summary-comment">Huomautus päätöslistaan</label>
      <HelpTooltip testId={"tooltip-huomautus"} content={helpTexts["hankkeen_sivu__arviointi___huomautus_päätöslistaan"]} direction={"arviointi-slim"} />
      <textarea id="summary-comment" rows="1" disabled={!allowEditing} value={this.state.summaryComment}
             onChange={evt => this.summaryCommentUpdated(evt.target.value) } maxLength="128" />
    </div>
  }
}
