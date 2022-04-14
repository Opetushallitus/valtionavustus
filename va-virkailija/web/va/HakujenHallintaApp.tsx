import React from 'react'
import ReactDOM from 'react-dom'
import moment from 'moment'
// @ts-ignore react-widgets-moment doesn't have proper types
import MomentLocalizer from 'react-widgets-moment'
import Localization from 'react-widgets/Localization'

import TopBar from './TopBar'
import { HeaderContainer } from './NewHeader'
import HakujenHallintaController, { State } from './HakujenHallintaController'
import { HakuListing } from './haku-list/HakuListing'
import { EditorSelector } from './haku-details/EditorSelector'
import LocalStorage from './LocalStorage'
import { translationsFi } from 'soresu-form/web/va/i18n/translations'

import './style/virkailija.less'
import './style/topbar.less'
import './style/admin.less'
interface HakujenHallintaAppProps {
  state: State
  controller: HakujenHallintaController
}

moment.locale('fi')
const momentLocalizer = new MomentLocalizer(moment)

const HakujenHallintaApp = ({ state, controller }: HakujenHallintaAppProps) => {
  const { environment, selectedHaku, translations, codeOptions, helpTexts, saveStatus, userInfo } = state
  return (
    <Localization date={momentLocalizer} messages={translationsFi.calendar}>
      <section>
        {environment['new-top-bar']?.['enabled?']
          ? <HeaderContainer activeTab='admin' environment={environment} userInfo={userInfo} saveStatus={saveStatus} />
          : <TopBar activeTab="admin" environment={environment} state={state}/>
        }
        <section id="container">
          <HakuListing hakuList={state.hakuList}
                       selectedHaku={state.selectedHaku}
                       filter={state.filter}
                       controller={controller} />
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

const controller = new HakujenHallintaController()
const hakuId = LocalStorage.avustushakuId() || 1
const stateP = controller.initializeState(hakuId)

stateP.onValue(function(state) {
  if (state.hakuList) {
    ReactDOM.render(<HakujenHallintaApp state={state} controller={controller}/>, document.getElementById('app'))
  }
})
