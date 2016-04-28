import React, { Component } from 'react'

import HakemusPreview from './HakemusPreview.jsx'
import HakemusArviointi from './HakemusArviointi.jsx'

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

    const onClose = (e) => {
      controller.closeHakemusDetail()
    }

    const onToggle = (e) => {
      document.body.classList.toggle('split-view')
      e.preventDefault()
      return false
    }

    const CloseButton = () => <button className="close" onClick={onClose} style={{position:"fixed",zIndex:"20000",marginTop:"-5",marginLeft:"-40"}}>x</button>
    const ToggleButton = () => <button className="close" onClick={onToggle} style={{position:"fixed",zIndex:"20000",marginTop:"30",marginLeft:"-40"}}>↕</button>

    return (
      <div hidden={hidden} id="hakemus-details">
        <CloseButton/>
        <ToggleButton/>
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        <HakemusArviointi hakemus={hakemus}
                          avustushaku={avustushaku}
                          hakuData={hakuData}
                          translations={translations}
                          privileges={hakuData.privileges}
                          userInfo={userInfo}
                          loadingComments={loadingComments}
                          showOthersScores={showOthersScores}
                          controller={controller}/>
      </div>
    )
  }
}
