import React, {useEffect, useState} from 'react'
import ReactDOM from 'react-dom'
// @ts-ignore route-parser doesn't have proper types
import RouteParser from 'route-parser'
import queryString from 'query-string'

import TopBar from './TopBar'
import HakemustenArviointiController from './HakemustenArviointiController'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink'
import HakemusDecisionLink from './hakemus-details/HakemusDecisionLink'
import AvustushakuDropdown from './avustushaku/AvustushakuDropdown'
import ExcelExportLink from './avustushaku/ExcelExportLink'
import HakemusFilter from './hakemus-filter/HakemusFilter'
import LocalStorage from './LocalStorage'

import './style/topbar.less'
import './style/main.less'

import './hakemusten-arviointi.less'
import {State} from "./types";
import NewHakemusListing from "./hakemus-list/NewHakemusListing";
import {Hakemus} from "soresu-form/web/va/types";

interface Props {
  state: State
  controller: HakemustenArviointiController
  newHakemusListingUiEnabled: boolean
}

const App = ({state, controller}: Props) => {
    const hakuData = state.hakuData
    const avustushaku = hakuData.avustushaku
    const hakemusList = hakuData.hakemukset
    const hasSelected = typeof state.selectedHakemus === 'object'
    const selectedHakemus: Hakemus | undefined | {} = hasSelected ? state.selectedHakemus : {}
    const previouslySelectedHakemus = state.previouslySelectedHakemus
    const translations = state.translations
    const selectedHakemusAccessControl = state.selectedHakemusAccessControl
    const avustushakuList = state.avustushakuList
    const subTab = state.subTab
    const environment = hakuData.environment
    const helpTexts = state.helpTexts
    const [splitView, toggleSplitView] = useState(false)

    useEffect(() => {
      const escFunction = (event: KeyboardEvent) => {
        if(event.keyCode === 27) {
          controller.setModal(undefined)
        }
      }
      document.addEventListener('keydown', escFunction, false)
      return () => {
        document.removeEventListener('keydown', escFunction, false)
      }
    }, [])
    return (
      <section>
        <TopBar activeTab="arviointi" environment={environment} state={state}/>
        <section id="main-container" className="section-container">
          <div id="list-container" className={hasSelected ? "has-selected" : ""}>
            <div id="list-heading">
              <AvustushakuDropdown avustushaku={avustushaku} avustushakuList={avustushakuList} />
              <div className="right-side">
                <HakemusFilter controller={controller} hakemusFilter={state.hakemusFilter} hakuData={hakuData}/>
                <ExcelExportLink avustushaku={avustushaku} />
              </div>
            </div>
            {newHakemusListingUiEnabled
              ? <NewHakemusListing
                  selectedHakemus={selectedHakemus}
                  hakemusList={hakemusList}
                  avustushaku={avustushaku}
                  roles={hakuData.roles}
                  splitView={splitView}
                  onSelectHakemus={id => controller.selectHakemus(id)}
                  onYhteenvetoClick={filteredHakemusList => controller.gotoSavedSearch(filteredHakemusList)}
                 />
              : <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
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
                  state={state}/>}
          </div>
          <HakemusDetails hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={state.selectedHakemus}
                          translations={translations}
                          selectedHakemusAccessControl={selectedHakemusAccessControl}
                          userInfo={state.userInfo}
                          showOthersScores={state.showOthersScores}
                          subTab={subTab}
                          controller={controller}
                          environment={environment}
                          onClickToggle={() => toggleSplitView(current => !current)}
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

const defaultHakuId = LocalStorage.avustushakuId() || 1

const parsedAvustusHakuIdObject = new RouteParser('/avustushaku/:avustushaku_id/*ignore').match(location.pathname)
if (!parsedAvustusHakuIdObject?.avustushaku_id) {
  window.location.href = "/avustushaku/" + defaultHakuId + "/"
}
const avustushakuId = parsedAvustusHakuIdObject ? parseInt(parsedAvustusHakuIdObject["avustushaku_id"], 10) : defaultHakuId
LocalStorage.saveAvustushakuId(avustushakuId)
const query = queryString.parse(location.search)
const newHakemusListingUiEnabled = query["new-hakemus-listing-ui"] === "true"
const evaluator = query.arvioija ? parseInt(query.arvioija) : undefined
const controller = new HakemustenArviointiController()
const stateP = controller.initializeState(avustushakuId,evaluator)

stateP.onValue((state) => {
  if (state.hakuData && state.userInfo) {
    ReactDOM.render(<App state={state} controller={controller} newHakemusListingUiEnabled={newHakemusListingUiEnabled}/>, document.getElementById('app'))
  }
})
