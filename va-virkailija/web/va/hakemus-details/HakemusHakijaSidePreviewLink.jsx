import React, { Component } from 'react'

export default class HakemusHakijaSidePreviewLink extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const previewUrl = hakemus ? "/hakemus-preview/" + avustushakuId + "/" + hakemus["user-key"] : undefined

    return hakemus ?
      <a href={previewUrl} target="_blank">Tulostusversio</a>
      : undefined
  }
}
