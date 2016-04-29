import React, {Component} from 'react'
import PaatosUrl from './PaatosUrl'
export default class HakemusDecisionLink extends Component {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const userKey = hakemus["user-key"]
    const previewUrl = hakemus ? PaatosUrl.previewLink(avustushakuId,hakemus.id) : undefined
    const publicUrl = hakemus ? PaatosUrl.publicLink(avustushakuId,userKey) : undefined

    return hakemus && hakemus["user-key"] ?
      <span className="decision"><span className="decision">Päätös:</span>
        <a href={previewUrl} target="_blank" className="decision">Luonnos</a>|
        <a href={publicUrl} target="_blank" className="decision">Julkinen</a>
      </span>
      : <span/>
  }
}
