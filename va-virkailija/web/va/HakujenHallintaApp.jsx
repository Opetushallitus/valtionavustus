import "soresu-form/web/polyfills"

import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import queryString from 'query-string'
import moment from 'moment'
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'
import TopBar from './TopBar.tsx'
import HakujenHallintaController from './HakujenHallintaController'
import HakuListing from './haku-list/HakuListing.jsx'
import EditorSelector from './haku-details/EditorSelector.jsx'
import LocalStorage from './LocalStorage'
import { translationsFi } from 'va-common/web/va/i18n/translations'

import './style/virkailija.less'
import './style/topbar.less'
import './style/admin.less'

moment.locale('fi')
const momentLocalizer = new MomentLocalizer(moment)

export default class AdminApp extends Component {
  render() {
    const {state, controller} = this.props
    const environment =  state.environment
    const selectedHaku = state.selectedHaku ? state.selectedHaku : {}
    const translations = state.translations
    const codeOptions = state.codeOptions
    const helpTexts = state.helpTexts
    return (
      <Localization date={momentLocalizer} messages={translationsFi.calendar}>
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
                            formDraftJson={state.formDraftsJson[selectedHaku.id]}
                            valiselvitysFormDraft={state.valiselvitysFormDrafts[selectedHaku.id]}
                            valiselvitysFormDraftJson={state.valiselvitysFormDraftsJson[selectedHaku.id]}
                            loppuselvitysFormDraft={state.loppuselvitysFormDrafts[selectedHaku.id]}
                            loppuselvitysFormDraftJson={state.loppuselvitysFormDraftsJson[selectedHaku.id]}
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
      </Localization>
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
