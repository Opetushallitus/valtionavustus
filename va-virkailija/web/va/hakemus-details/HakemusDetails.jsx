import React, {Component} from 'react'

import HakemusPreview from './HakemusPreview.jsx'
import HakemusArviointi from './HakemusArviointi.jsx'

class HakemusValiselvitys extends Component {
  render() {
    return <div>Väliselvitys</div>
  }
}

class HakemusLoppuselvitys extends Component {
  render() {
    return <div>Loppuselvitys</div>
  }
}

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
    const subTab = this.props.subTab

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

    const CloseButton = () => <button className="close" onClick={onClose} style={{position:"fixed",zIndex:"20000",marginTop:"-5",marginLeft:"-40"}}>&times;</button>
    const ToggleButton = () => <button className="close" onClick={onToggle} style={{position:"fixed",zIndex:"20000",marginTop:"30",marginLeft:"-40"}}> ↕</button>

    const getSubTab = tabName => {
      switch (tabName) {
        case 'arviointi':
          return <HakemusArviointi hakemus={hakemus}
                                   avustushaku={avustushaku}
                                   hakuData={hakuData}
                                   translations={translations}
                                   privileges={hakuData.privileges}
                                   userInfo={userInfo}
                                   loadingComments={loadingComments}
                                   showOthersScores={showOthersScores}
                                   subTab={subTab}
                                   controller={controller}/>

        case 'valiselvitys':
          return <HakemusValiselvitys/>
        case 'loppuselvitys':
          return <HakemusLoppuselvitys/>
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
      <div hidden={hidden} id="hakemus-details">
        <CloseButton/>
        <ToggleButton/>
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        <div id="hakemus-arviointi">
          <div id="editor-subtab-selector" className="section-container">
            {tab('arviointi', 'Arviointi')}
            {tab('valiselvitys', 'Väliselvitys')}
            {tab('loppuselvitys', 'Loppuselvitys')}
          </div>
          <div id="tab-conent">{getSubTab(subTab)}</div>
        </div>
      </div>
    )
  }
}
