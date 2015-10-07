import PolyfillBind from 'va-common/web/polyfill-bind'
import ConsolePolyfill from 'console-polyfill'
import React, { Component } from 'react'
import _ from 'lodash'

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
    const selectedHakemus = state.selectedHakemus ? state.selectedHakemus : {}
    const translations = state.translations
    const loadingComments = state.loadingComments
    const avustushakuList = state.avustushakuList
    return (
      <section>
        <TopBar activeTab="arviointi" environment={hakuData.environment} state={state}/>
        <section id="container">
          <div id="list-container">
            <AvustushakuDropdown controller={controller} avustushaku={avustushaku} avustushakuList={avustushakuList} />
            <HakemusListing ophShareSum={hakuData["budget-oph-share-sum"]}
                            budgetGrantedSum={hakuData["budget-granted-sum"]}
                            hakuFilter={state.hakuFilter}
                            hakemusList={hakemusList}
                            selectedHakemus={selectedHakemus}
                            avustushaku={avustushaku}
                            controller={controller} />
          </div>
          <HakemusDetails hakuData={hakuData}
                          avustushaku={avustushaku}
                          hakemus={selectedHakemus}
                          translations={translations}
                          loadingComments={loadingComments}
                          controller={controller}/>
          <div id="footer">
            <HakemusHakijaSidePreviewLink hakemus={selectedHakemus} avustushaku={avustushaku} />
          </div>
        </section>
      </section>
    )
  }
}

var parser = document.createElement('a');
parser.href = location
const pathElements = _.filter(parser.pathname.split("/"), (element) => { return element != "" })
const avustushakuId = pathElements.length == 2 && pathElements[0] == "avustushaku" ? pathElements[1] : "1"

const controller = new HakemustenArviointiController()
const stateP = controller.initializeState(avustushakuId)

stateP.onValue((state) => {
  try {
    if (state.hakuData && state.userInfo) {
      React.render(<App state={state} controller={controller}/>, document.getElementById('app'))
    } else {
      console.log('Not rendering yet, because state.hakuData not yet loaded.')
    }
  } catch (e) {
    console.log('Error from React.render with state', state, e)
  }
})
