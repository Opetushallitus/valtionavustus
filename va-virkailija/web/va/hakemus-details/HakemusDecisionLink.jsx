import React, { Component } from 'react'

export default class HakemusDecisionLink extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const previewUrl = hakemus ? "/paatos/avustushaku/" + avustushakuId + "/hakemus/" + hakemus.id : undefined

    return hakemus && hakemus["user-key"] ?
      <a href={previewUrl} target="_blank" className="decision">Päätös</a>
      : <span/>
  }
}
