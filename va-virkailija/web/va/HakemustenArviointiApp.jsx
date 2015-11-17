import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import ReactDOM from 'react-dom'
import _ from 'lodash'
import RouteParser from 'route-parser'

import Dispatcher from 'soresu-form/web/Dispatcher'

import TopBar from './TopBar.jsx'
import HakemustenArviointiController from './HakemustenArviointiController.jsx'
import HakemusListing from './hakemus-list/HakemusListing.jsx'
import HakemusDetails from './hakemus-details/HakemusDetails.jsx'
import HakemusHakijaSidePreviewLink from './hakemus-details/HakemusHakijaSidePreviewLink.jsx'
import AvustushakuDropdown from './avustushaku/AvustushakuDropdown.jsx'

import virkailija from './style/virkailija.less'
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
    const translations = state.translations
    const loadingComments = state.loadingComments
    const avustushakuList = state.avustushakuList
    return (
      <section>
        <TopBar activeTab="arviointi" environment={hakuData.environment} state={state}/>
        <section id="main-container" className="section-container">
          <div id="list-container" className={hasSelected ? "has-selected" : ""}>
            <AvustushakuDropdown controller={controller} avustushaku={avustushaku} avustushakuList={avustushakuList} />
            <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
                            budgetGrantedSum={hakuData["budget-granted-sum"]}
                            hakemusFilter={state.hakemusFilter}
                            hakemusSorter={state.hakemusSorter}
                            hakemusList={hakemusList}
                            hasSelected={hasSelected}
                            selectedHakemus={selectedHakemus}
                            userInfo={state.userInfo}
                            privileges={hakuData.privileges}
                            controller={controller} />
          </div>
          <HakemusDetails hidden={!hasSelected}
                          hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={selectedHakemus}
                          translations={translations}
                          userInfo={state.userInfo}
                          loadingComments={loadingComments}
                          showOthersScores={state.showOthersScores}
                          controller={controller}/>
          <div hidden={!hasSelected} id="footer">
            <HakemusHakijaSidePreviewLink hakemus={selectedHakemus} avustushaku={avustushaku} />
          </div>
        </section>
      </section>
    )
  }
}

const defaultHakuId = 1
const parsedAvustusHakuIdObject = new RouteParser('/avustushaku/:avustushaku_id/*ignore').match(location.pathname)
if (!parsedAvustusHakuIdObject || _.isUndefined(parsedAvustusHakuIdObject["avustushaku_id"])) {
  window.location.href = "/avustushaku/" + defaultHakuId + "/"
}

const avustushakuId = parsedAvustusHakuIdObject ? parsedAvustusHakuIdObject["avustushaku_id"] : defaultHakuId

const controller = new HakemustenArviointiController()
const stateP = controller.initializeState(avustushakuId)

stateP.onValue((state) => {
  try {
    if (state.hakuData && state.userInfo) {
      ReactDOM.render(<App state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from ReactDOM.render with state', state, e)
  }
})
