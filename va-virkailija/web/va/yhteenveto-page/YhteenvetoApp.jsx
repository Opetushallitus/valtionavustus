import React, { Component } from 'react'
import { createRoot } from 'react-dom/client'
import _ from 'lodash'
// @ts-ignore
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController'
import HakemusArviointiStatuses from '../HakemusArviointiStatuses'
import DateUtil from 'soresu-form/web/DateUtil'

import 'soresu-form/web/form/style/theme.css'
import '../style/main.css'
import './summary.css'
import ErrorBoundary from '../common-components/ErrorBoundary'

class SummaryApp extends Component {
  render() {
    const state = this.props.state
    const hakuData = state.hakuData
    const hakemusList = hakuData.hakemukset.map((h) =>
      h.refused
        ? Object.assign(h, {
          status: 'refused',
          arvio: Object.assign(h.arvio, { status: 'refused' }),
        })
        : h
    )
    const avustushaku = hakuData.avustushaku
    const applicationsByStatus = _.groupBy(hakemusList, (h) => h.arvio.status)
    const titleString = SummaryApp.titleString(avustushaku)
    const mailToBody = encodeURIComponent(
      titleString + '\n\nLinkki päätöslistaan:\n\n' + location.href
    )
    const mailToLink = 'mailto:?subject=' + titleString + '&body=' + mailToBody

    return (
      <section id="container" className="section-container">
        <SummaryHeading avustushaku={avustushaku} hakemusList={hakemusList} />
        {buildSummaryList(
          SummaryApp.statusesInOrder(),
          applicationsByStatus,
          state.hakuData.avustushaku
        )}
        <div id="summary-link">
          <a href={mailToLink}>Lähetä linkki sähköpostilla</a>
        </div>
      </section>
    )
  }

  static statusesInOrder() {
    const statuses = ['refused'].concat(HakemusArviointiStatuses.statuses)
    statuses.reverse()
    return statuses
  }

  static titleString(avustushaku) {
    return 'Päätöslista – ' + SummaryApp.avustusHakuLabelString(avustushaku)
  }

  static toDateStr(dateTime) {
    return DateUtil.asDateString(dateTime)
  }

  static avustusHakuLabelString(avustushaku) {
    const hakuDuration = avustushaku.content.duration
    const durationString =
      SummaryApp.toDateStr(hakuDuration.start) + '-' + SummaryApp.toDateStr(hakuDuration.end)
    return avustushaku.content.name.fi + ' (' + durationString + ')'
  }
}

const buildSummaryList = (statuses, applicationsByStatuses, grant) => {
  const statusKeys = _.keys(applicationsByStatuses)
  const summaryListingsAll = statuses
    .filter((s) => _.includes(statusKeys, s))
    .map((s) => (
      <SummaryListing
        key={s}
        arvioStatus={s}
        hakemusList={applicationsByStatuses[s]}
        grant={grant}
      />
    ))
  return summaryListingsAll
}

const sumBy = (list, fieldFunc) => _.sum(list.map(fieldFunc))
const sumByOphShare = _.partialRight(sumBy, (hakemus) => hakemus['budget-oph-share'])
const sumByBudgetGranted = _.partialRight(sumBy, (hakemus) => hakemus.arvio['budget-granted'])

class SummaryHeading extends Component {
  render() {
    const titleString = SummaryApp.avustusHakuLabelString(this.props.avustushaku)
    const hakemusList = this.props.hakemusList
    const ophShareSum = sumByOphShare(hakemusList)
    const budgetGrantedSum = sumByBudgetGranted(hakemusList)

    const applicationsByStatus = _.groupBy(hakemusList, (h) => h.arvio.status)
    const statusKeys = _.keys(applicationsByStatus)

    return (
      <div>
        <h1>{titleString}</h1>
        <h2 style={{ textTransform: 'uppercase' }}>Päätöslista</h2>
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
            {SummaryApp.statusesInOrder()
              .filter((s) => _.includes(statusKeys, s))
              .map((s) => {
                const applications = applicationsByStatus[s]
                return (
                  <SummaryTableRow
                    key={s}
                    label={SummaryListing.arvioStatusFiForSummary(s)}
                    count={applicationsByStatus[s].length}
                    applied={sumByOphShare(applications)}
                    granted={sumByBudgetGranted(applications)}
                    testIdPrefix={s}
                  />
                )
              })}
          </tbody>
          <tfoot>
            <SummaryTableRow
              key="total-summary-row"
              label="Yhteensä"
              count={hakemusList.length}
              applied={ophShareSum}
              granted={budgetGrantedSum}
              isTotalSummary={true}
              testIdPrefix="combined"
            />
          </tfoot>
        </table>
      </div>
    )
  }
}

const SummaryTableRow = ({
  label,
  count,
  applied,
  granted,
  isTotalSummary = false,
  testIdPrefix,
}) => {
  const moneyClasses = isTotalSummary ? 'money sum' : 'money'
  return (
    <tr className="summary-heading-table-row" data-test-id={`summary-for-${testIdPrefix}`}>
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

class SummaryListing extends Component {
  render() {
    const { hakemusList, grant, arvioStatus } = this.props
    const hakemusListSorted = _.sortBy(hakemusList, 'organization-name')
    const hakemusCount = hakemusListSorted.length
    const heading = SummaryListing.arvioStatusFiForSummary(arvioStatus) + ' (' + hakemusCount + ')'
    const ophShareSum = sumByOphShare(hakemusListSorted)
    const multiBatch = grant.content.multiplemaksuera && grant.content['payment-size-limit']
    const hakemusElements = hakemusListSorted.map((hakemus) => (
      <HakemusRow
        key={hakemus.id}
        hakemus={hakemus}
        multiBatch={multiBatch}
        grant={this.props.grant}
      />
    ))
    const budgetGrantedSum = sumByBudgetGranted(hakemusListSorted)

    return (
      <table
        key="hakemusListing"
        className="summary-hakemus-table"
        data-test-id={`${arvioStatus}-table`}
      >
        <thead>
          <tr>
            <th
              colSpan={5}
              className="status-heading-column"
              data-test-id={`${arvioStatus}-table-heading`}
            >
              {heading}
            </th>
          </tr>
          <tr>
            <th className="organization-column">Hakija</th>
            <th className="project-name-column">Hanke</th>
            <th className="applied-money-column">Haettu</th>
            <th className="granted-money-column">Myönnetty</th>
            {multiBatch ? <th className="batch-column">1. erä</th> : null}
            {multiBatch ? <th className="batch-column">2. erä</th> : null}
            <th className="comment-column">Huom</th>
          </tr>
        </thead>
        <tbody>{hakemusElements}</tbody>
        <tfoot>
          <tr>
            <td colSpan={2} className="total-applications-column">
              &nbsp;
            </td>
            <td className="applied-money-column">
              <span className="money sum">{ophShareSum}</span>
            </td>
            <td className="granted-money-column">
              <span className="money sum">{budgetGrantedSum}</span>
            </td>
            {multiBatch ? <td className="batch-column">&nbsp;</td> : null}
            {multiBatch ? <td className="batch-column">&nbsp;</td> : null}
            <td className="comment-column">&nbsp;</td>
          </tr>
        </tfoot>
      </table>
    )
  }

  static arvioStatusFiForSummary(status) {
    switch (status) {
      case 'rejected':
        return 'Kielteiset päätökset'
      case 'accepted':
        return 'Myönteiset päätökset'
      case 'refused':
        return 'Vastaanottamatta jättäneet'
    }
    return HakemusArviointiStatuses.statusToFI(status)
  }
}

function calculateBatchSize(application, grant) {
  if (
    grant.content['payment-size-limit'] === 'no-limit' ||
    application.arvio['budget-granted'] >= grant.content['payment-fixed-limit']
  ) {
    return (application.arvio['budget-granted'] * grant.content['payment-min-first-batch']) / 100.0
  } else {
    return application.arvio['budget-granted']
  }
}

const HakemusRow = ({ hakemus, multiBatch, grant }) => {
  const htmlId = 'hakemus-' + hakemus.id
  const hakemusName = hakemus['project-name']
  const firstBatch = multiBatch ? calculateBatchSize(hakemus, grant) : 0

  return (
    <tr id={htmlId} className="overview-row">
      <td className="organization-column" title={hakemus['organization-name']}>
        {hakemus['organization-name']}
      </td>
      <td className="project-name-column" title={hakemusName}>
        {hakemusName}
      </td>
      <td className="applied-money-column">
        <span className="money">{hakemus['budget-oph-share']}</span>
      </td>
      <td className="granted-money-column">
        <span className="money">{hakemus.arvio['budget-granted']}</span>
      </td>
      {multiBatch ? <td className="batch-column">{firstBatch.toFixed(0)} €</td> : null}
      {multiBatch ? (
        <td className="batch-column">
          {(hakemus.arvio['budget-granted'] - firstBatch).toFixed(0)} €
        </td>
      ) : null}
      <td className="comment-column" title={hakemus.arvio['summary-comment']}>
        {hakemus.arvio['summary-comment']}
      </td>
    </tr>
  )
}

const parsedRoute = new RouteParser(
  '/yhteenveto/avustushaku/:avustushaku_id/listaus/:saved_search_id/'
).match(location.pathname)
if (!parsedRoute || _.isUndefined(parsedRoute['avustushaku_id'])) {
  setInterval(() => {
    const redirectUrlFromServer = localStorage.getItem('va.arviointi.admin.summary.url')
    if (!_.isEmpty(redirectUrlFromServer)) {
      localStorage.removeItem('va.arviointi.admin.summary.url')
      window.location.href = redirectUrlFromServer
    }
  }, 500)
}

const controller = new YhteenvetoController()
const stateP = controller.initializeState(parsedRoute)

const app = document.getElementById('app')
const root = createRoot(app)

stateP.onValue((state) => {
  if (state.hakuData && state.userInfo) {
    root.render(
      <ErrorBoundary>
        <SummaryApp state={state} controller={controller} />
      </ErrorBoundary>
    )
  }
})
