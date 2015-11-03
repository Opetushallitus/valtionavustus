import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import _ from 'lodash'
import RouteParser from 'route-parser'

import YhteenvetoController from './YhteenvetoController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink.jsx'

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
        <SummaryHeading avustushaku={avustushaku} />
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
    return <h2>{avustushaku.content.name.fi}</h2>
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
      React.render(<SummaryApp state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
