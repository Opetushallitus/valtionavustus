import React, { Component } from 'react'

import HakemusPreview from './HakemusPreview.jsx'

export default class HakemusDetails extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    return (
      <div id="hakemus-details">
        <HakemusPreview avustushakuId={avustushaku.id} hakemus={hakemus}/>
      </div>
    )
  }
}