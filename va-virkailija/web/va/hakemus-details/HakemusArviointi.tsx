import _ from 'lodash'
import React, { Component } from 'react'
import * as Bacon from 'baconjs'

import HttpUtil from 'soresu-form/web/HttpUtil'
import DateUtil from 'soresu-form/web/DateUtil'
import { Avustushaku, ChangeLogEntry, Hakemus, HelpTexts, LegacyTranslations, UserInfo } from 'soresu-form/web/va/types'

import HakemusBudgetEditing from '../budgetedit/HakemusBudgetEditing'
import HakemusScoring from './HakemusScoring'
import HakemusComments from './HakemusComments'
import HakemusArviointiStatuses from "./HakemusArviointiStatuses"
import TraineeDayEditing from '../traineeday/TraineeDayEditing'
import ChooseRahoitusalueAndTalousarviotili from './ChooseRahoitusalueAndTalousarviotili'
import SpecifyOppilaitos from './SpecifyOppilaitos'
import AcademySize from './AcademySize'
import Perustelut from './Perustelut'
import PresenterComment from './PresenterComment'
import EditStatus from './EditStatus'
import ReSendDecisionEmail from './ReSendDecisionEmail'
import ApplicationPayments from './ApplicationPayments'
import HelpTooltip from '../HelpTooltip'
import HakemustenArviointiController from '../HakemustenArviointiController'
import { HakuData, SelectedHakemusAccessControl } from '../types'

import '../style/admin.less'

type HakemusArviointiProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  avustushaku: Avustushaku
  translations: LegacyTranslations
  hakuData: HakuData
  userInfo: UserInfo
  helpTexts: HelpTexts
  showOthersScores: boolean
  multibatchEnabled: boolean
  selectedHakemusAccessControl: SelectedHakemusAccessControl
}

export default class HakemusArviointi extends Component<HakemusArviointiProps> {
  render() {
    const {controller, hakemus, avustushaku, hakuData, translations,
           userInfo, showOthersScores,
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
         comments={comments}
         allowHakemusCommenting={allowHakemusCommenting}
         helpTexts={helpTexts}/>
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

class ChangeLog extends React.Component<{ hakemus: Hakemus }>{
  render(){
    const hakemus = this.props.hakemus
    const changelogs = hakemus.arvio.changeLog
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

type ChangeLogRowProps = {
  hakemus: Hakemus
  changelog: ChangeLogEntry
}

type ChangeLogRowState = {
  currentHakemusId: number
  open: boolean
}

class ChangeLogRow extends React.Component<ChangeLogRowProps, ChangeLogRowState> {
  constructor(props: ChangeLogRowProps){
    super(props)
    this.state = ChangeLogRow.initialState(props)
  }

  static getDerivedStateFromProps(props: ChangeLogRowProps, state: ChangeLogRowState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return ChangeLogRow.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: ChangeLogRowProps) {
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
      this.setState({open: !this.state.open})
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
           <td colSpan={3}>
             <pre className="changelog__data">{JSON.stringify(changelog.data)}</pre>
           </td>
          )}
        </tr>
      </tbody>
    )
  }
}

type SetArviointiStatusProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  helpTexts: HelpTexts
  allowEditing?: boolean
}

class SetArviointiStatus extends React.Component<SetArviointiStatusProps> {
  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const arvio = hakemus.arvio
    const status = arvio ? arvio.status : undefined
    const controller = this.props.controller
    const helpTexts = this.props.helpTexts
    const statuses = []
    const statusValues = HakemusArviointiStatuses.statuses
      for (let i = 0; i < statusValues.length; i++) {
      const htmlId = "set-arvio-status-" + statusValues[i]
      const statusFI = HakemusArviointiStatuses.statusToFI(statusValues[i])
      const onChange = allowEditing ? controller.setHakemusArvioStatus(hakemus, statusValues[i]) : undefined
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

type ChangeRequestProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  helpTexts: HelpTexts
  avustushaku: Avustushaku
  allowEditing?: boolean
}

type ChangeRequestState = {
  currentHakemusId: number,
  preview: boolean
  mail?: Mail
}

type Mail = {
  subject: string
  sender: string
  content: string
}

class ChangeRequest extends Component<ChangeRequestProps, ChangeRequestState> {
  constructor(props: ChangeRequestProps){
    super(props)
    this.state = ChangeRequest.initialState(props)
  }

  static getDerivedStateFromProps(props: ChangeRequestProps, state: ChangeRequestState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return ChangeRequest.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: ChangeRequestProps) {
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
    const openEdit = allowEditing ? controller.setChangeRequestText(hakemus, "") : undefined
    const closeEdit = allowEditing ? controller.setChangeRequestText(hakemus, undefined) : undefined
    const onTextChange = function(event: React.ChangeEvent<HTMLTextAreaElement>) {
      controller.setChangeRequestText(hakemus, event.target.value)()
    }
    const sendChangeRequest = allowEditing ? controller.setHakemusStatus(hakemus, "pending_change_request", () => hakemus.changeRequest ?? '') : undefined
    const newChangeRequest = typeof hakemus.changeRequest !== 'undefined' && !hasChangeRequired

    const onPreview = () =>{
      const sendS = Bacon.fromPromise<{ mail: Mail }>(HttpUtil.post(`/api/avustushaku/${avustushaku.id}/change-request-email`,{ text: hakemus.changeRequest }))
      sendS.onValue((res)=>{
        this.setState({ ...this.state, preview:true, mail: res.mail })
      })
    }

    const closePreview = () => this.setState({...this.state, preview:false})
    const mail = this.state.mail
    return (
      <div className="value-edit">
        <button type="button"
                hidden={newChangeRequest || hasChangeRequired}
                onClick={openEdit}
                disabled={!allowEditing}
                data-test-id="request-change-button">Pyydä täydennystä </button>
        <HelpTooltip testId={"tooltip-taydennys"} content={helpTexts["hankkeen_sivu__arviointi___pyydä_täydennystä"]} direction="arviointi" />
        <div hidden={!newChangeRequest}>
          <label>Lähetä täydennyspyyntö</label>
          <span onClick={closeEdit} className="close"></span>
          <textarea data-test-id='täydennyspyyntö__textarea' placeholder="Täydennyspyyntö hakijalle" onChange={onTextChange} rows={4} disabled={!allowEditing} value={hakemus.changeRequest}/>
          <button data-test-id='täydennyspyyntö__lähetä' type="button" disabled={_.isEmpty(hakemus.changeRequest)} onClick={sendChangeRequest}>Lähetä</button>
          <a onClick={onPreview} style={{position:'relative'}}>Esikatsele</a>
          {(this.state.preview && mail) && <div className="panel email-preview-panel">
            <span className="close" onClick={closePreview}></span>
            <div data-test-id="change-request-preview-subject">
              <strong>Otsikko:</strong> {mail.subject}<br/>
            </div>
            <div data-test-id="change-request-preview-sender">
              <strong>Lähettäjä:</strong> {mail.sender}<br/><br/>
            </div>
            <div data-test-id="change-request-preview-content" style={{whiteSpace:'pre-line'}}>
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

type SummaryCommentProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  helpTexts: HelpTexts
  allowEditing?: boolean
}

type SummaryCommentState = {
  currentHakemusId: number
  summaryComment: string
}

class SummaryComment extends React.Component<SummaryCommentProps, SummaryCommentState> {
  summaryCommentBus: Bacon.Bus<[a: Hakemus, b: string]>

  constructor(props: SummaryCommentProps) {
    super(props)
    this.state = SummaryComment.initialState(props)
    this.summaryCommentBus = new Bacon.Bus()
    this.summaryCommentBus.debounce(1000).onValue(([hakemus, newSummaryComment]) => this.props.controller.setHakemusSummaryComment(hakemus, newSummaryComment))
  }

  static getDerivedStateFromProps(props: SummaryCommentProps, state: SummaryCommentState) {
    if (props.hakemus.id !== state.currentHakemusId) {
      return SummaryComment.initialState(props)
    } else {
      return null
    }
  }

  static initialState(props: SummaryCommentProps) {
    return {
      currentHakemusId: props.hakemus.id,
      summaryComment: SummaryComment.getSummaryComment(props.hakemus)
    }
  }

  static getSummaryComment(hakemus: Hakemus) {
    const arvio = hakemus.arvio ? hakemus.arvio : { "summary-comment": "" }
    return arvio["summary-comment"] ??  ""
  }


  summaryCommentUpdated(newSummaryComment: string) {
    this.setState({summaryComment: newSummaryComment})
    this.summaryCommentBus.push([this.props.hakemus, newSummaryComment])
  }

  render() {
    const allowEditing = this.props.allowEditing
    const helpTexts = this.props.helpTexts

    return <div className="value-edit summary-comment">
      <label htmlFor="summary-comment">Huomautus päätöslistaan</label>
      <HelpTooltip testId={"tooltip-huomautus"} content={helpTexts["hankkeen_sivu__arviointi___huomautus_päätöslistaan"]} direction="arviointi-slim" />
      <textarea id="summary-comment" rows={1} disabled={!allowEditing} value={this.state.summaryComment}
             onChange={evt => this.summaryCommentUpdated(evt.target.value) } maxLength={128} />
    </div>
  }
}
