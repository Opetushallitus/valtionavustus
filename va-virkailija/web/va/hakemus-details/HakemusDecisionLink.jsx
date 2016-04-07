import React, {Component} from 'react'

export default class HakemusDecisionLink extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const previewUrl = hakemus ? "/paatos/avustushaku/" + avustushakuId + "/hakemus/" + hakemus.id : undefined
    const publicUrl = hakemus ? "/public/paatos/avustushaku/" + avustushakuId + "/hakemus/" + hakemus.id : undefined

    return hakemus && hakemus["user-key"] ?
      <span className="decision"><span className="decision">Päätös:</span>
        <a href={previewUrl} target="_blank" className="decision">Luonnos</a>|
        <a href={publicUrl} target="_blank" className="decision">Julkinen</a>
      </span>
      : <span/>
  }
}
