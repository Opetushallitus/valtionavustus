import "soresu-form/web/polyfills"

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import queryString from 'query-string'

import TopBar from './TopBar.jsx'
import HakujenHallintaController from './HakujenHallintaController.jsx'
import HakuListing from './haku-list/HakuListing.jsx'
import { EditorSelector } from './haku-details/EditorSelector'
import LocalStorage from './LocalStorage'

import './style/virkailija.less'
import './style/topbar.less'
import './style/admin.less'

export default class AdminApp extends Component {
  render() {
    const {state, controller} = this.props
    const environment =  state.environment
    const selectedHaku = state.selectedHaku ? state.selectedHaku : {}
    const translations = state.translations
    const codeOptions = state.codeOptions
    const helpTexts = state.helpTexts
    return (
      <section>
        <TopBar activeTab="admin" environment={environment} state={state}/>
        <section id="container">
          <HakuListing hakuList={state.hakuList}
                       selectedHaku={state.selectedHaku}
                       filter={state.filter}
                       controller={controller}
          />
          <EditorSelector subTab={state.subTab}
                          avustushaku={selectedHaku}
                          decisionLiitteet={state.decisionLiitteet}
                          formDraft={state.formDrafts[selectedHaku.id]}
                          valiselvitysFormDraft={state.valiselvitysFormDrafts[selectedHaku.id]}
                          loppuselvitysFormDraft={state.loppuselvitysFormDrafts[selectedHaku.id]}
                          environment={environment}
                          vaUserSearch={state.vaUserSearch}
                          koodistos={state.koodistos}
                          userInfo={state.userInfo}
                          controller={controller}
                          translations={translations}
                          codeOptions={codeOptions}
                          helpTexts={helpTexts} />
        </section>
      </section>
    )
  }
}

const develMode = queryString.parse(location.search).devel === 'true'

const controller = new HakujenHallintaController()

const hakuId = LocalStorage.avustushakuId() || 1

const stateP = controller.initializeState(hakuId)

stateP.onValue(function(state) {
  if (state.hakuList) {
    if (develMode) {
      console.log("Updating UI with state:", state)
    }
    ReactDOM.render(<AdminApp state={state} controller={controller}/>, document.getElementById('app'))
  }
})
