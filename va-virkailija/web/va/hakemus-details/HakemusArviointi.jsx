import Bacon from 'baconjs'
import HttpUtil from 'va-common/web/HttpUtil.js'
import React, { Component } from 'react'
import _ from 'lodash'
import DateUtil from 'soresu-form/web/form/DateUtil'
import FormUtil from 'soresu-form/web/form/FormUtil'

import HakemusBudgetEditing, { BudgetGranted } from '../budgetedit/HakemusBudgetEditing.jsx'

import HakemusScoring from './HakemusScoring.jsx'
import HakemusComments from './HakemusComments.jsx'
import HakemusArviointiStatuses from "./HakemusArviointiStatuses.js"
import HakemusStatuses from './HakemusStatuses.js'
import TraineeDayEditing from '../traineeday/TraineeDayEditing.jsx'
import ChooseRahoitusalue from './ChooseRahoitusalue.jsx'
import Perustelut from './Perustelut.jsx'

export default class HakemusArviointi extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const translations = this.props.translations
    const privileges = this.props.privileges
    const hakuIsPublishedAndEnded = avustushaku.status === "published" && avustushaku.phase === "ended"
    const allowHakemusCommenting = hakuIsPublishedAndEnded
    const allowHakemusStateChanges = privileges["change-hakemus-state"] && hakuIsPublishedAndEnded
    const allowHakemusScoring = privileges["score-hakemus"] && hakuIsPublishedAndEnded
    const userInfo = this.props.userInfo
    const comments = hakemus.comments
    const loadingComments = this.props.loadingComments
    const showOthersScores = this.props.showOthersScores
    return (
     <div id="hakemus-arviointi">
       <ChooseRahoitusalue controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges}/>
       <HakemusScoring controller={controller} hakemus={hakemus} avustushaku={avustushaku}
                       allowHakemusScoring={allowHakemusScoring} userInfo={userInfo} showOthersScores={showOthersScores}/>
       <HakemusComments controller={controller} hakemus={hakemus} comments={comments} loadingComments={loadingComments} allowHakemusCommenting={allowHakemusCommenting}/>
       <SetArviointiStatus controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <Perustelut controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <ChangeRequest controller={controller} hakemus={hakemus} avustushaku={avustushaku} allowEditing={allowHakemusStateChanges} />
       <SummaryComment controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <HakemusBudgetEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <TraineeDayEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}  allowEditing={allowHakemusStateChanges} />
       <ChangeLog hakemus={hakemus}/>
     </div>
    )
  }
}

class ChangeLog extends React.Component{
  render(){
    const hakemus = this.props.hakemus
    const changelogs = _.get(this.props.hakemus, "arvio.changelog")
    if (!changelogs) return null
    return (
      <div>
        <h4>Muutoshistoria</h4>
        {changelogs.length==0 && <div>Ei muutoksia</div>}
        <table style={{width:'100%'}}>
          <colgroup>
            <col width="100"/>
            <col width="150"/>
          </colgroup>
          {changelogs.map((changelog, index)=><ChangeLogRow key={index} changelog={changelog} hakemus={hakemus}/>)}
        </table>
      </div>
    )
  }
}

class ChangeLogRow extends React.Component{
  constructor(props){
    super(props)
    this.state = {open:false}
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState({open:false})
    }
  }

  render(){
    const changelog = this.props.changelog
    const types = {
      "budget-change": "Budjetti päivitetty",
      "summary-comment": "Perustelut hakijalle",
      "overridden-answers-change": "Sisältöä päivitetty",
      "status-change": "Tila päivitetty"
    }
    const typeTranslated = types[changelog.type] || changelog.type
    const dateStr = DateUtil.asDateString(changelog.timestamp) + " " + DateUtil.asTimeString(changelog.timestamp)

    const toggleOpen = ()=> {
      this.setState({open:!this.state.open})
    }
    return (
      <tbody>
        <tr>
          <td>{dateStr}</td>
          <td>{changelog["first-name"]} {changelog["last-name"]}</td>
          <td><a onClick={toggleOpen}>{typeTranslated}</a></td>
        </tr>
        <tr>
          {this.state.open &&
            <td colSpan="3">
              <pre style={{whiteSpace:'pre-wrap',backgroundColor:'#dfdfdf',padding:5}}>{JSON.stringify(changelog.data)}</pre>
            </td>
          }
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
    const statuses = []
    const statusValues = HakemusArviointiStatuses.allStatuses();
    for (var i=0; i < statusValues.length; i++) {
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
                 checked={statusValues[i] === status ? true: null}
              />
      )
      statuses.push(
          <label key={htmlId + "-label"} htmlFor={htmlId}>{statusFI}</label>
      )
    }

    return (
      <div className="value-edit">
        {statuses}
      </div>
    )
  }
}



class ChangeRequest extends React.Component {

  constructor(props){
    super(props)
    this.state = {preview:false}
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.state = {preview:false}
    }
  }

  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const status = hakemus.status
    const hasChangeRequired = status === 'pending_change_request'
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
    const sendChangeRequest = allowEditing ? controller.setHakemusStatus(hakemus, "pending_change_request", _ => hakemus.changeRequest) : null
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
                disabled={!allowEditing}>Pyydä täydennystä</button>
        <div hidden={!newChangeRequest}>
          <label>Lähetä täydennyspyyntö</label>
          <span onClick={closeEdit} className="close"></span>
          <textarea placeholder="Täydennyspyyntö hakijalle" onChange={onTextChange} rows="4" disabled={!allowEditing} value={hakemus.changeRequest}/>
          <button type="button" disabled={_.isEmpty(hakemus.changeRequest)} onClick={sendChangeRequest}>Lähetä</button>
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
          <div className="change-request-title">* Täydennyspyyntö lähetetty {lastChangeRequestTime}</div>
          <pre className="change-request-text">{lastChangeRequestText}</pre>
        </div>
      </div>
    )
  }
}

class SummaryComment extends React.Component {
  constructor(props) {
    super(props)
    this.state = {summaryComment: getSummaryComment(this.props.hakemus)}
    this.summaryCommentBus = new Bacon.Bus()
    this.summaryCommentBus.debounce(1000).onValue(([hakemus, newSummaryComment]) => this.props.controller.setHakemusSummaryComment(hakemus, newSummaryComment))
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.hakemus.id !== nextProps.hakemus.id) {
      this.setState({summaryComment: getSummaryComment(nextProps.hakemus)})
    }
  }

  summaryCommentUpdated(newSummaryComment) {
    this.setState({summaryComment: newSummaryComment})
    this.summaryCommentBus.push([this.props.hakemus, newSummaryComment])
  }

  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const controller = this.props.controller
    return <div className="value-edit summary-comment">
      <label htmlFor="summary-comment">Huomautus ratkaisuyhteenvetoon</label>
      <textarea id="summary-comment" rows="1" disabled={!allowEditing} value={this.state.summaryComment}
             onChange={evt => this.summaryCommentUpdated(evt.target.value) } maxLength="128" />
    </div>
  }
}

function getSummaryComment(hakemus) {
  const arvio = hakemus.arvio ? hakemus.arvio : {}
  const summaryComment = arvio["summary-comment"] ||  ""
  return summaryComment
}
