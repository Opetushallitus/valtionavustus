import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController.jsx'
import HakemusArviointiStatuses from './hakemus-details/HakemusArviointiStatuses.js'
import DateUtil from 'soresu-form/web/form/DateUtil'
import RahoitusAlueet from './data/Rahoitusalueet'

import style from './style/main.less'
import summaryStyle from './style/summary.less'

export default class SummaryApp extends Component {
  render() {
    const state = this.props.state
    const hakuData = state.hakuData
    const hakemusList = hakuData.hakemukset
    const avustushaku = hakuData.avustushaku
    const multipleRahoitusalue = avustushaku.content.rahoitusalueet && avustushaku.content.rahoitusalueet.length > 0
    const applicationsByStatus = _.groupBy(hakemusList, h => h.arvio.status)
    const summaryListings = multipleRahoitusalue ?
      <RahoitusalueList hakemusList={hakemusList}/> :
      BuildSummaryList(SummaryApp.statusesInOrder(),applicationsByStatus)

    const titleString = SummaryApp.titleString(avustushaku)
    const mailToBody = encodeURIComponent(titleString + "\n\nLinkki ratkaisuyhteenvetoon:\n\n" + location.href)
    const mailToLink = "mailto:?subject=" + titleString + "&body=" + mailToBody

    return (
      <section id="container" className="section-container">
        <SummaryHeading avustushaku={avustushaku} hakemusList={hakemusList} />
        {summaryListings}
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

const BuildSummaryList = (statuses,applicationsByStatuses)=>{
  const summaryListingsAll = []
  _.each(statuses, s => {
    if (_.contains(_.keys(applicationsByStatuses), s)) {
      const applications = applicationsByStatuses[s]
      summaryListingsAll.push(<SummaryListing key={s} arvioStatus={s} hakemusList={applications} />)
    }
  })
  return summaryListingsAll
}

const RahoitusalueList = ({hakemusList})=>{
  const applicationsByRahoitusalue = _.groupBy(hakemusList, h => h.arvio.rahoitusalue)
  const nullValue = "null"
  const undefinedValue = "undefined"
  const withoutLabel = "Muut"
  const applicationsWithoutRahoitusalue = (applicationsByRahoitusalue[nullValue] || []).concat(applicationsByRahoitusalue[undefinedValue] || [])
  if(applicationsWithoutRahoitusalue.length>0){
    applicationsByRahoitusalue[withoutLabel] = applicationsWithoutRahoitusalue
  }
  const rahoitusAlueetNameValues = _.chain(applicationsByRahoitusalue).
    omit([nullValue,undefinedValue]).
    keys().
    sortBy((x)=> x==withoutLabel ? 9999: RahoitusAlueet.indexOf(x)).
    map((x)=>{return {
      name:x,
      values:applicationsByRahoitusalue[x]
    }
    }).
    value()
  const rahoitusalueet = rahoitusAlueetNameValues.map((item)=>{
    const applicationsByStatuses = _.groupBy(item.values, h => h.arvio.status)
    const summaryByStates = BuildSummaryList(SummaryApp.statusesInOrder(),applicationsByStatuses)
    return (<div key={item.name}>
      <h2 className="rahoitusalue-heading">{item.name}</h2>
      {summaryByStates}
    </div>)
  })

  return (
    <div>
      {rahoitusalueet}
    </div>
  )
}


const SumBy = (list,fieldFunc) => _.sum(list.map(fieldFunc))
const SumByOphShare = _.partialRight(SumBy, (hakemus)=>hakemus["budget-oph-share"]);
const SumByBudgetGranted = _.partialRight(SumBy, (hakemus)=>hakemus.arvio["budget-granted"]);

class SummaryHeading extends Component {
  render() {
    const titleString = SummaryApp.avustusHakuLabelString(this.props.avustushaku)
    const hakemusList = this.props.hakemusList
    const ophShareSum = SumByOphShare(hakemusList)
    const budgetGrantedSum = SumByBudgetGranted(hakemusList)

    const applicationsByStatus = _.groupBy(hakemusList, h => h.arvio.status)
    const statusSummaryRows = []
    _.each(SummaryApp.statusesInOrder(), s => {
      if (_.contains(_.keys(applicationsByStatus), s)) {
        const applications = applicationsByStatus[s]
        const appliedOphShareSum = SumByOphShare(applications)
        const grantedSum = SumByBudgetGranted(applications)
        statusSummaryRows.push(<SummaryTableRow key={s} label={SummaryListing.arvioStatusFiForSummary(s)} count={applications.length} applied={appliedOphShareSum} granted={grantedSum} />)
      }
    })

    return (
      <div>
        <h1>{titleString}</h1>
        <h2 style={{textTransform:'uppercase'}}>Ratkaisuyhteenveto</h2>
        <table className="summary-heading-table">
          <thead>
            <tr>
              <th className="arvio-status-column">&nbsp;</th>
              <th className="count-column">Kpl</th>
              <th className="applied-money-column">Haettu</th>
              <th className="granted-money-column">Myönnetty</th>
            </tr>
          </thead>
          <tbody>
            {statusSummaryRows}
          </tbody>
          <tfoot>
            <SummaryTableRow key="total-summary-row" label="Yhteensä" count={hakemusList.length} applied={ophShareSum} granted={budgetGrantedSum} isTotalSummary={true} />
          </tfoot>
        </table>
      </div>
    )
  }
}

const SummaryTableRow = ({label, count, applied, granted, isTotalSummary = false}) => {
  const moneyClasses = isTotalSummary ? "money sum" : "money"
  return (
    <tr className="summary-heading-table-row">
      <td className="arvio-status-column">{label}</td>
      <td className="count-column">{count}</td>
      <td className="applied-money-column">
        <span className={moneyClasses}>{applied}</span>
      </td>
      <td className="granted-money-column">
        <span className={moneyClasses}>{granted}</span>
      </td>
    </tr>
  )
}

export default class SummaryListing extends Component {
  render() {
    const hakemusList = this.props.hakemusList
    const hakemusListSorted = _.sortBy(hakemusList,'organization-name')
    const hakemusCount = hakemusListSorted.length
    const heading = SummaryListing.arvioStatusFiForSummary(this.props.arvioStatus) + " (" + hakemusCount + ")"
    const ophShareSum = SumByOphShare(hakemusListSorted)
    const hakemusElements = hakemusListSorted.map(hakemus => <HakemusRow key={hakemus.id} hakemus={hakemus} />)
    const budgetGrantedSum = SumByBudgetGranted(hakemusListSorted)

    return (
      <table key="hakemusListing" className="summary-hakemus-table">
        <thead>
        <tr><th colSpan="5" className="status-heading-column">{heading}</th></tr>
        <tr>
          <th className="organization-column">Hakija</th>
          <th className="project-name-column">Hanke</th>
          <th className="applied-money-column">Haettu</th>
          <th className="granted-money-column">Myönnetty</th>
          <th className="comment-column">Huom</th>
        </tr></thead>
        <tbody>
          {hakemusElements}
        </tbody>
        <tfoot><tr>
          <td colSpan="2" className="total-applications-column">
            &nbsp;
          </td>
          <td className="applied-money-column"><span className="money sum">{ophShareSum}</span></td>
          <td className="granted-money-column"><span className="money sum">{budgetGrantedSum}</span></td>
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

const HakemusRow = ({hakemus}) => {
    const htmlId = "hakemus-" + hakemus.id
    const hakemusName = hakemus["project-name"]
    return (
      <tr id={htmlId} className="overview-row">
        <td className="organization-column" title={hakemus["organization-name"]}>{hakemus["organization-name"]}</td>
        <td className="project-name-column" title={hakemusName}>{hakemusName}</td>
        <td className="applied-money-column"><span className="money">{hakemus["budget-oph-share"]}</span></td>
        <td className="granted-money-column"><span className="money">{hakemus.arvio["budget-granted"]}</span></td>
        <td className="comment-column" title={hakemus.arvio["summary-comment"]}>{hakemus.arvio["summary-comment"]}</td>
    </tr>
    )
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
  if (state.hakuData && state.userInfo) {
    ReactDOM.render(<SummaryApp state={state} controller={controller}/>, document.getElementById('app'))
  }
})
