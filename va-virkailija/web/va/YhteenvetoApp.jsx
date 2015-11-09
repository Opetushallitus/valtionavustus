import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController.jsx'
import HakemusStatuses from './hakemus-details/HakemusStatuses.js'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink.jsx'
import {BasicInfoComponent} from 'soresu-form/web/form/component/InfoElement.jsx'

import virkailija from './style/virkailija.less'
import style from './style/main.less'
import summaryStyle from './style/summary.less'

export default class SummaryApp extends Component {
  render() {
    const state = this.props.state
    const hakuData = state.hakuData
    const hakemusList = hakuData.hakemukset
    const avustushaku = hakuData.avustushaku
    const applicationsByStatus = _.groupBy(hakemusList, h => { return h.arvio.status })
    const summaryListings = []
    _.each(this.statusesInOrder(), s => {
      if (_.contains(_.keys(applicationsByStatus), s)) {
        const applications = applicationsByStatus[s]
        summaryListings.push(<SummaryListing key={s} arvioStatus={s} hakemusList={applications} />)
      }
    })

    return (
      <section id="container" className="section-container">
        <SummaryHeading avustushaku={avustushaku} hakemusList={hakemusList} />
        <div id="list-container">
          {summaryListings}
        </div>
      </section>
    )
  }

  statusesInOrder() {
    const statuses = _.cloneDeep(HakemusStatuses.allStatuses())
    statuses.reverse()
    return statuses
  }
}

class SummaryHeading extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const hakuDuration = avustushaku.content.duration
    const durationString = this.toDateStr(hakuDuration.start) + "–" + this.toDateStr(hakuDuration.end)

    return <div>
             <h2>{avustushaku.content.name.fi} ({durationString})</h2>
           </div>
  }

  toDateStr(dateTime) {
    return BasicInfoComponent.asDateString(dateTime)
  }
}

export default class SummaryListing extends Component {
  render() {
    const heading = SummaryListing.arvioStatusFiForSummary(this.props.arvioStatus)
    const hakemusList = this.props.hakemusList
    const ophShareSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus["budget-oph-share"] }, 0)
    const hakemusElements = _.map(hakemusList, hakemus => {
      return <HakemusRow key={hakemus.id} hakemus={hakemus} /> })
    const budgetGrantedSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus.arvio["budget-granted"] }, 0)

    return (
      <table key="hakemusListing" className="hakemus-list overview-list">
        <thead>
        <tr><th colSpan="4" className="status-heading-column">{heading}</th></tr>
        <tr>
          <th className="organization-column">Hakijaorganisaatio</th>
          <th className="project-name-column">Hanke</th>
          <th className="applied-sum-column">Haettu</th>
          <th className="granted-sum-column">Myönnetty</th>
        </tr></thead>
        <tbody>
          {hakemusElements}
        </tbody>
        <tfoot><tr>
          <td colSpan="2" className="total-applications-column">
            {hakemusList.length} hakemusta
          </td>
          <td className="applied-sum-column"><span className="money sum">{ophShareSum}</span></td>
          <td className="granted-sum-column"><span className="money sum">{budgetGrantedSum}</span></td>
        </tr></tfoot>
      </table>
    )
  }

  static arvioStatusFiForSummary(status) {
    switch(status) {
      case "rejected":
        return "Kielteiset päätökset"
      case "accepted":
        return "Myönteiset päätökset"
    }
    return "Ratkaisemattomat hakemukset, joiden tila on '" + HakemusStatuses.statusToFI(status).toLocaleLowerCase() + "'"
  }
}

class HakemusRow extends Component {
  render() {
    const hakemus = this.props.hakemus
    const htmlId = "hakemus-" + hakemus.id
    const hakemusName = hakemus["project-name"]
    return <tr id={htmlId} className="overview-row">
      <td className="organization-column" title={hakemus["organization-name"]}>{hakemus["organization-name"]}</td>
      <td className="project-name-column" title={hakemusName}>{hakemusName}</td>
      <td className="applied-sum-column"><span className="money">{hakemus["budget-oph-share"]}</span></td>
      <td className="granted-sum-column"><span className="money">{hakemus.arvio["budget-granted"]}</span></td>
    </tr>
  }
}

const parsedRoute = new RouteParser('/yhteenveto/avustushaku/:avustushaku_id/listaus/:saved_search_id/').match(location.pathname)
if (!parsedRoute || _.isUndefined(parsedRoute["avustushaku_id"])) {
  setInterval(() => {
    const redirectUrlFromServer = localStorage.getItem("va.arviointi.admin.summary.url")
    if (!_.isEmpty(redirectUrlFromServer)) {
      localStorage.removeItem("va.arviointi.admin.summary.url")
      window.location.href = redirectUrlFromServer
    }
  }, 500)
}

const controller = new YhteenvetoController()
const stateP = controller.initializeState(parsedRoute)

stateP.onValue((state) => {
  try {
    if (state.hakuData && state.userInfo) {
      ReactDOM.render(<SummaryApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from ReactDOM.render with state', state, e)
  }
})
