import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
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
    return (
      <section id="container" className="section-container">
        <SummaryHeading avustushaku={avustushaku} hakemusList={hakemusList} />
        <div id="list-container">
          <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
                          budgetGrantedSum={hakuData["budget-granted-sum"]}
                          hakemusFilter={state.hakemusFilter}
                          hakemusSorter={state.hakemusSorter}
                          hakemusList={hakemusList}
                          hasSelected={false}
                          userInfo={state.userInfo}
                          controller={controller} />
        </div>
      </section>
    )
  }
}

class SummaryHeading extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const hakemusList = this.props.hakemusList
    const hakuDuration = avustushaku.content.duration
    const durationString = this.toDateStr(hakuDuration.start) + "–" + this.toDateStr(hakuDuration.end)

    const applicationsByStatus = _.groupBy(hakemusList, h => { return h.arvio.status })
    const statusSummaryRows = []
    _.each(this.statusesInOrder(), s => {
      if (_.contains(_.keys(applicationsByStatus), s)) {
        const applications = applicationsByStatus[s]
        const appliedOphShareSum = HakemusListing.formatNumber(_.reduce(applications, (total, hakemus) => { return total + hakemus["budget-oph-share"] }, 0))
        const budgetGrantedSum = HakemusListing.formatNumber(_.reduce(applications, (total, hakemus) => { return total + hakemus.arvio["budget-granted"] }, 0))
        const text = HakemusStatuses.statusToFI(s) + " " + applications.length + ". Haettu " + appliedOphShareSum + " €, myönnetty " + budgetGrantedSum + " €"
        statusSummaryRows.push(<li key={s}>{text}</li>)
      }
    })

    return <div>
             <h2>{avustushaku.content.name.fi}</h2>
             <div>{durationString}</div>
             <ul>
             {statusSummaryRows}
             </ul>
           </div>
  }

  toDateStr(dateTime) {
    return BasicInfoComponent.asDateString(dateTime)
  }

  statusesInOrder() {
    const statuses = _.cloneDeep(HakemusStatuses.allStatuses())
    statuses.reverse()
    return statuses
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
