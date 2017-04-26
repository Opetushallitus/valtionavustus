import React, {Component} from 'react'

import HakemusPreview from './HakemusPreview.jsx'
import HakemusArviointi from './HakemusArviointi.jsx'
import Selvitys from './Selvitys.jsx'
import Seuranta from './Seuranta.jsx'
import styles from './hakemusDetails.less'

export default class HakemusDetails extends Component {
  render() {
    const hidden = this.props.hidden
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const userInfo = this.props.userInfo
    const loadingComments = this.props.loadingComments
    const showOthersScores = this.props.showOthersScores
    const translations = this.props.translations
    const selectedHakemusAccessControl = this.props.selectedHakemusAccessControl
    const subTab = this.props.subTab
    if(hidden) return null;

    const onClose = (e) => {
      document.body.classList.remove('split-view')
      controller.closeHakemusDetail()
    }

    const onToggle = (e) => {
      document.body.classList.toggle('split-view')
      if(document.body.classList.contains('split-view')) {
        const container = document.querySelector('.hakemus-list tbody.has-selected')
        const selected = document.querySelector('#list-container tbody.has-selected .overview-row.selected')
        container.scrollTop = selected.offsetTop - 100
      }
      e.preventDefault()
      return false
    }

    const CloseButton = () => <button id="close-hakemus-button" onClick={onClose}>&times;</button>
    const ToggleButton = () => <button id="toggle-hakemus-list-button" onClick={onToggle}>↕</button>

    const getSubTab = tabName => {
      switch (tabName) {
        case 'arviointi':
          return <HakemusArviointi hakemus={hakemus}
                                   avustushaku={avustushaku}
                                   hakuData={hakuData}
                                   translations={translations}
                                   selectedHakemusAccessControl={selectedHakemusAccessControl}
                                   userInfo={userInfo}
                                   loadingComments={loadingComments}
                                   showOthersScores={showOthersScores}
                                   subTab={subTab}
                                   controller={controller}/>

        case 'valiselvitys':
          return <Selvitys controller={controller} hakemus={hakemus} avustushaku={avustushaku} userInfo={userInfo} translations={translations} selvitysType="valiselvitys"/>
        case 'loppuselvitys':
          return <Selvitys controller={controller} hakemus={hakemus} avustushaku={avustushaku} userInfo={userInfo} translations={translations} selvitysType="loppuselvitys"/>
        case 'seuranta':
          return <Seuranta controller={controller} hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        default:
          throw new Error("Bad subTab selection '" + tabName + "'")
      }
    }
    const tab = (name, label) => <span className={subTab === name ? 'selected' : ''} onClick={createSubTabSelector(name)}>{label}</span>

    function createSubTabSelector(subTabToSelect) {
      return e => {
        e.preventDefault()
        controller.selectEditorSubtab(subTabToSelect)
      }
    }

    return (
      <div id="hakemus-details">
        <CloseButton/>
        <ToggleButton/>
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        <div id="hakemus-arviointi">
          <div id="editor-subtab-selector" className="section-container">
            {tab('arviointi', 'Arviointi')}
            {tab('valiselvitys', 'Väliselvitys')}
            {tab('loppuselvitys', 'Loppuselvitys')}
            {tab('seuranta', 'Seuranta')}
          </div>
          <div id="tab-content">{getSubTab(subTab)}</div>
        </div>
      </div>
    )
  }
}
