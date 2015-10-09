import React, { Component } from 'react'

import HakemusPreview from './HakemusPreview.jsx'
import HakemusArviointi from './HakemusArviointi.jsx'

export default class HakemusDetails extends Component {
  render() {
    const controller = this.props.controller
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const hakuData = this.props.hakuData
    const userInfo = this.props.userInfo
    const loadingComments = this.props.loadingComments
    const translations = this.props.translations

    return (
      <div id="hakemus-details">
        <HakemusPreview hakemus={hakemus} avustushaku={avustushaku} hakuData={hakuData} translations={translations}/>
        <HakemusArviointi hakemus={hakemus}
                          avustushaku={avustushaku}
                          userInfo={userInfo}
                          loadingComments={loadingComments}
                          controller={controller}/>
      </div>
    )
  }
}
