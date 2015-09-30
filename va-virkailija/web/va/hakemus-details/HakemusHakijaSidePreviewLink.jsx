import React, { Component } from 'react'

export default class HakemusHakijaSidePreviewLink extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const previewUrl = hakemus ? "/hakemus-preview/" + avustushakuId + "/" + hakemus["user-key"] : undefined

    return hakemus ?
      <a className="hakija-preview-link" href={previewUrl} target="_blank">Avaa esikatselu omaan ikkunaansa</a>
      : undefined
  }
}
