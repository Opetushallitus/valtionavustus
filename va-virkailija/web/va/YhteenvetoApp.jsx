import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses.js'
import DateUtil from 'soresu-form/web/form/DateUtil'

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
    _.each(SummaryApp.statusesInOrder(), s => {
      if (_.contains(_.keys(applicationsByStatus), s)) {
        const applications = applicationsByStatus[s]
        summaryListings.push(<SummaryListing key={s} arvioStatus={s} hakemusList={applications} />)
      }
    })

    const titleString = SummaryApp.titleString(avustushaku)
    const mailToBody = encodeURIComponent(titleString + "\n\nLinkki ratkaisuyhteenvetoon:\n\n" + location.href)
    const mailToLink = "mailto:?subject=" + titleString + "&body=" + mailToBody

    return (
      <section id="container" className="section-container">
        <SummaryHeading avustushaku={avustushaku} hakemusList={hakemusList} />
        <div id="list-container">
          {summaryListings}
        </div>
        <div id="summary-link">
          <a href={mailToLink}>Lähetä linkki sähköpostilla</a>
        </div>
      </section>
    )
  }

  static statusesInOrder() {
    const statuses = _.cloneDeep(HakemusArviointiStatuses.allStatuses())
    statuses.reverse()
    return statuses
  }

  static titleString(avustushaku) {
    return "Ratkaisuyhteenveto – " + SummaryApp.avustusHakuLabelString(avustushaku)
  }

  static avustusHakuLabelString(avustushaku) {
    const hakuDuration = avustushaku.content.duration
    const durationString = toDateStr(hakuDuration.start) + "-" + toDateStr(hakuDuration.end)
    return avustushaku.content.name.fi +  " (" + durationString + ")"

    function toDateStr(dateTime) {
      return DateUtil.asDateString(dateTime)
    }
  }
}

class SummaryHeading extends Component {
  render() {
    const titleString = SummaryApp.avustusHakuLabelString(this.props.avustushaku)
    const hakemusList = this.props.hakemusList
    const ophShareSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus["budget-oph-share"] }, 0)
    const budgetGrantedSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus.arvio["budget-granted"] }, 0)

    const applicationsByStatus = _.groupBy(hakemusList, h => { return h.arvio.status })
    const statusSummaryRows = []
    _.each(SummaryApp.statusesInOrder(), s => {
      if (_.contains(_.keys(applicationsByStatus), s)) {
        const applications = applicationsByStatus[s]
        const appliedOphShareSum = _.reduce(applications, (total, hakemus) => {
          return total + hakemus["budget-oph-share"]
        }, 0)
        const grantedSum = _.reduce(applications, (total, hakemus) => {
          return total + hakemus.arvio["budget-granted"]
        }, 0)
        statusSummaryRows.push(<SummaryTableRow key={s} label={SummaryListing.arvioStatusFiForSummary(s)} count={applications.length} applied={appliedOphShareSum} granted={grantedSum} />)
      }
    })
    statusSummaryRows.push(<SummaryTableRow key="total-summary-row" label="Yhteensä" count={hakemusList.length} applied={ophShareSum} granted={budgetGrantedSum} />)

    return <div>
             <h1>{titleString}</h1>
             <h2>Ratkaisuyhteenveto</h2>
               <table className="summary-heading-table">
                 <thead>
                   <tr>
                     <th className="arvio-status-column">&nbsp;</th>
                     <th className="count-column">Kpl</th>
                     <th className="applied-column">Haettu</th>
                     <th className="granted-column">Myönnetty</th></tr>
                 </thead>
                 <tbody>
                   {statusSummaryRows}
                 </tbody>
               </table>
           </div>
  }
}

class SummaryTableRow extends Component {
  render() {
    const label = this.props.label
    const count = this.props.count
    const appliedSum = this.props.applied
    const grantedSum = this.props.granted
    return <tr className="summary-heading-table-row">
             <td className="arvio-status-column">{label}</td>
             <td>{count}</td>
             <td className="applied-column"><span className="money">{appliedSum}</span></td>
             <td className="granted-column"><span className="money">{grantedSum}</span></td>
           </tr>
  }
}

export default class SummaryListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const hakemusCount = hakemusList.length
    const heading = SummaryListing.arvioStatusFiForSummary(this.props.arvioStatus) + " (" + hakemusCount + ")"
    const ophShareSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus["budget-oph-share"] }, 0)
    const hakemusElements = _.map(hakemusList, hakemus => {
      return <HakemusRow key={hakemus.id} hakemus={hakemus} /> })
    const budgetGrantedSum = _.reduce(hakemusList, (total, hakemus) => { return total + hakemus.arvio["budget-granted"] }, 0)

    return (
      <table key="hakemusListing" className="hakemus-list overview-list">
        <thead>
        <tr><th colSpan="4" className="status-heading-column">{heading}</th></tr>
        <tr>
          <th className="organization-column">Hakija</th>
          <th className="project-name-column">Hanke</th>
          <th className="applied-sum-column">Haettu</th>
          <th className="granted-sum-column">Myönnetty</th>
          <th className="comment-column">Huom</th>
        </tr></thead>
        <tbody>
          {hakemusElements}
        </tbody>
        <tfoot><tr>
          <td colSpan="2" className="total-applications-column">
            &nbsp;
          </td>
          <td className="applied-sum-column"><span className="money sum">{ophShareSum}</span></td>
          <td className="granted-sum-column"><span className="money sum">{budgetGrantedSum}</span></td>
          <td className="comment-column">&nbsp;</td>
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
    return HakemusArviointiStatuses.statusToFI(status)
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
      <td className="comment-column" title={hakemus.arvio["summary-comment"]}>{hakemus.arvio["summary-comment"]}</td>
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
