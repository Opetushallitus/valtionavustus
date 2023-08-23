import React, { Component } from 'react'
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'
import PaatosUrl from '../../PaatosUrl'

type HakemusDecisionLinkProps = {
  avustushaku: Avustushaku
  hakemus: Hakemus
}

export default class HakemusDecisionLink extends Component<HakemusDecisionLinkProps> {
  render() {
    const hakemus = this.props.hakemus
    const avustushaku = this.props.avustushaku
    const avustushakuId = avustushaku.id
    const previewUrl = hakemus ? PaatosUrl.previewLink(avustushakuId, hakemus.id) : undefined
    const publicUrl = hakemus['user-key']
      ? PaatosUrl.publicLink(avustushakuId, hakemus['user-key'])
      : undefined

    return hakemus && hakemus['user-key'] ? (
      <span className="decision">
        <span className="decision">Päätös:</span>
        <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="decision">
          Luonnos
        </a>
        |
        <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="decision">
          Julkinen
        </a>
      </span>
    ) : (
      <span />
    )
  }
}
