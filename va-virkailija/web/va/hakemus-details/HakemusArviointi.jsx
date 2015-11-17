import React, { Component } from 'react'

import FormUtil from 'soresu-form/web/form/FormUtil'

import HakemusScoring from './HakemusScoring.jsx'
import HakemusComments from './HakemusComments.jsx'
import HakemusArviointiStatuses from "./HakemusArviointiStatuses.js"
import HakemusStatuses from './HakemusStatuses.js'

export default class HakemusArviointi extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const privileges = this.props.privileges
    const allowHakemusStateChanges = privileges["change-hakemus-state"]
    const allowHakemusScoring = privileges["score-hakemus"]
    const userInfo = this.props.userInfo
    const comments = hakemus.comments
    const loadingComments = this.props.loadingComments
    const showOthersScores = this.props.showOthersScores
    return (
     <div id="hakemus-arviointi">
       <HakemusScoring controller={controller} hakemus={hakemus} avustushaku={avustushaku}
                       allowHakemusScoring={allowHakemusScoring} userInfo={userInfo} showOthersScores={showOthersScores}/>
       <HakemusComments controller={controller} hakemus={hakemus} comments={comments} loadingComments={loadingComments}/>
       <SetArviointiStatus controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <ChangeRequest controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <BudgetGranted controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
       <SummaryComment controller={controller} hakemus={hakemus} allowEditing={allowHakemusStateChanges} />
     </div>
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
      <div>
        {statuses}
      </div>
    )
  }
}

class ChangeRequest extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const status = hakemus.status
    const statusFI = HakemusStatuses.statusToFI(status)
    const hasChangeRequired = status === 'pending_change_request'
    const controller = this.props.controller
    const onClick = allowEditing ? controller.setHakemusStatus(hakemus, 'pending_change_request') : null
    return (
      <div className="value-edit">
        <label hidden={hasChangeRequired} htmlFor="require-change">Hakemus on {statusFI}</label>
        <label hidden={!hasChangeRequired} htmlFor="require-change">Hakemukseen on pyydetty täydennystä</label>
        <button hidden={hasChangeRequired}
                onClick={onClick}
                disabled={!allowEditing}
                id="require-change"
                name="require-change">Pyydä täydennystä</button>
      </div>
    )
  }
}

class BudgetGranted extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const arvio = hakemus.arvio
    const allowEditing = this.props.allowEditing
    const budgetGranted = _.get(arvio, "budget-granted", 0)
    const controller = this.props.controller
    const onChange = e => {
      const inputValue = e.target.value
      const inputValueWithNumericInput = inputValue ? inputValue.replace(/\D/g,'') : "0"
      const number = FormUtil.isNumeric(inputValueWithNumericInput) ? parseInt(inputValueWithNumericInput) : 0
      controller.setHakemusArvioBudgetGranted(hakemus, number)
    }

    return <div className="value-edit budget-granted">
      <label htmlFor="budget-granted">Myönnetty avustus</label>
      <input id="budget-granted" disabled={!allowEditing} type="text" value={budgetGranted} onChange={onChange} maxLength="9" /> €
    </div>
  }
}

class SummaryComment extends React.Component {
  render() {
    const hakemus = this.props.hakemus
    const allowEditing = this.props.allowEditing
    const arvio = hakemus.arvio
    const summaryComment = arvio ? arvio["summary-comment"] : undefined
    const controller = this.props.controller
    return <div className="value-edit summary-comment">
      <label htmlFor="summary-comment">Huomautus ratkaisuyhteenvetoon</label>
      <input id="summary-comment" type="text" disabled={!allowEditing} value={summaryComment} title={summaryComment}
             onChange={e => { controller.setHakemusSummaryComment(hakemus, e.target.value) }} maxLength="128" />
    </div>
  }
}
