import "soresu-form/web/polyfills"

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import queryString from 'query-string'

import Dispatcher from 'soresu-form/web/Dispatcher'

import TopBar from './TopBar.jsx'
import HakemustenArviointiController from './HakemustenArviointiController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails.jsx'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink.jsx'
import HakemusDecisionLink from './hakemus-details/HakemusDecisionLink.jsx'
import AvustushakuDropdown from './avustushaku/AvustushakuDropdown.jsx'
import ExcelExportLink from './avustushaku/ExcelExportLink.jsx'
import HakemusFilter from './hakemus-filter/HakemusFilter.jsx'
import LocalStorage from './LocalStorage'

import topbar from './style/topbar.less'
import style from './style/main.less'
import selector from './style/switcher.less'

export default class App extends Component {
  render() {
    const state = this.props.state
    const hakuData = state.hakuData
    const avustushaku = hakuData.avustushaku
    const hakemusList = hakuData.hakemukset
    const hasSelected = typeof state.selectedHakemus === 'object'
    const selectedHakemus = hasSelected ? state.selectedHakemus : {}
    const previouslySelectedHakemus = state.previouslySelectedHakemus
    const translations = state.translations
    const selectedHakemusAccessControl = state.selectedHakemusAccessControl
    const loadingComments = state.loadingComments
    const avustushakuList = state.avustushakuList
    const subTab = state.subTab

    return (
      <section>
        <TopBar activeTab="arviointi" environment={hakuData.environment} state={state}/>
        <section id="main-container" className="section-container">
          <div id="list-container" className={hasSelected ? "has-selected" : ""}>
            <div id="list-heading">
              <AvustushakuDropdown controller={controller} avustushaku={avustushaku} avustushakuList={avustushakuList} />
              <div className="right-side">
                <HakemusFilter controller={controller} hakemusFilter={state.hakemusFilter} hakuData={hakuData}/>
                <ExcelExportLink avustushaku={avustushaku} />
              </div>
            </div>
            <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
                            budgetGrantedSum={hakuData["budget-granted-sum"]}
                            hakemusFilter={state.hakemusFilter}
                            hakemusSorter={state.hakemusSorter}
                            hakemusList={hakemusList}
                            hasSelected={hasSelected}
                            selectedHakemus={selectedHakemus}
                            previouslySelectedHakemus={previouslySelectedHakemus}
                            userInfo={state.userInfo}
                            privileges={hakuData.privileges}
                            controller={controller}
                            avustushaku={avustushaku}
                            state={state}/>
          </div>
          <HakemusDetails hidden={!hasSelected}
                          hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={selectedHakemus}
                          translations={translations}
                          selectedHakemusAccessControl={selectedHakemusAccessControl}
                          userInfo={state.userInfo}
                          loadingComments={loadingComments}
                          showOthersScores={state.showOthersScores}
                          subTab={subTab}
                          controller={controller}/>
          <div hidden={!hasSelected} id="footer">
            <HakemusHakijaSidePreviewLink hakemus={selectedHakemus} avustushaku={avustushaku} />
            <HakemusDecisionLink hakemus={selectedHakemus} avustushaku={avustushaku} />
          </div>
        </section>
      </section>
    )
  }
}

const defaultHakuId = LocalStorage.avustushakuId() || 1

const parsedAvustusHakuIdObject = new RouteParser('/avustushaku/:avustushaku_id/*ignore').match(location.pathname)
if (!parsedAvustusHakuIdObject || _.isUndefined(parsedAvustusHakuIdObject["avustushaku_id"])) {
  window.location.href = "/avustushaku/" + defaultHakuId + "/"
}
const avustushakuId = parsedAvustusHakuIdObject ? parsedAvustusHakuIdObject["avustushaku_id"] : defaultHakuId
LocalStorage.saveAvustushakuId(avustushakuId)
const query = queryString.parse(location.search)
const evaluator = query.arvioija ? parseInt(query.arvioija) : undefined
const develMode = query.devel === 'true'
const controller = new HakemustenArviointiController()
const stateP = controller.initializeState(avustushakuId,evaluator)

stateP.onValue((state) => {
  if (state.hakuData && state.userInfo) {
    if (develMode) {
      console.log("Updating UI with state:", state)
    }
    ReactDOM.render(<App state={state} controller={controller}/>, document.getElementById('app'))
  }
})
