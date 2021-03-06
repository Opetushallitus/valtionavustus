import "soresu-form/web/polyfills"

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'
import queryString from 'query-string'

import TopBar from './TopBar.tsx'
import HakemustenArviointiController from './HakemustenArviointiController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink.jsx'
import HakemusDecisionLink from './hakemus-details/HakemusDecisionLink.jsx'
import AvustushakuDropdown from './avustushaku/AvustushakuDropdown.jsx'
import ExcelExportLink from './avustushaku/ExcelExportLink.jsx'
import HakemusFilter from './hakemus-filter/HakemusFilter.jsx'
import LocalStorage from './LocalStorage'

import './style/topbar.less'
import './style/main.less'

import './hakemusten-arviointi.less'

export default class App extends Component {
  constructor(props) {
    super(props)
    this.escFunction = this.escFunction.bind(this)
  }

  escFunction(event) {
    if(event.keyCode === 27) {
      controller.setModal(undefined)
    }
  }

  componentDidMount() {
    document.addEventListener('keydown', this.escFunction, false)
  }

  componentWillUnmount() {
    document.removeEventListener('keydown', this.escFunction, false)
  }

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
    const avustushakuList = state.avustushakuList
    const subTab = state.subTab
    const environment = hakuData.environment
    const helpTexts = state.helpTexts

    return (
      <section>
        <TopBar activeTab="arviointi" environment={environment} state={state}/>
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
                            environment={environment}
                            state={state}/>
          </div>
          <HakemusDetails hidden={!hasSelected}
                          hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={selectedHakemus}
                          translations={translations}
                          selectedHakemusAccessControl={selectedHakemusAccessControl}
                          userInfo={state.userInfo}
                          showOthersScores={state.showOthersScores}
                          subTab={subTab}
                          controller={controller}
                          environment={environment}
                          helpTexts={helpTexts}/>
          <div hidden={!hasSelected} id="footer">
            <HakemusHakijaSidePreviewLink hakemus={selectedHakemus} avustushaku={avustushaku} />
            <HakemusDecisionLink hakemus={selectedHakemus} avustushaku={avustushaku} />
          </div>
        </section>
        {state.modal}
      </section>
    )
  }
}

const defaultHakuId = LocalStorage.avustushakuId() || 1

const parsedAvustusHakuIdObject = new RouteParser('/avustushaku/:avustushaku_id/*ignore').match(location.pathname)
if (!parsedAvustusHakuIdObject || _.isUndefined(parsedAvustusHakuIdObject["avustushaku_id"])) {
  window.location.href = "/avustushaku/" + defaultHakuId + "/"
}
const avustushakuId = parsedAvustusHakuIdObject ? parseInt(parsedAvustusHakuIdObject["avustushaku_id"], 10) : defaultHakuId
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
