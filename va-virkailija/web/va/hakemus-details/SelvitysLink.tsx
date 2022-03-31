import { Component } from 'react';
import HelpTooltip from "../HelpTooltip"
import { Avustushaku, Hakemus } from 'soresu-form/web/va/types'

type SelvitysLinkProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  selvitysType: 'valiselvitys' | 'loppuselvitys'
  helpText: string
}

export default class SelvitysLink extends Component<SelvitysLinkProps> {
  render() {
    const {hakemus, avustushaku, selvitysType, helpText} = this.props
    const userKey = hakemus["user-key"]
    const publicUrl = `/selvitys/avustushaku/${avustushaku.id}/${selvitysType}?hakemus=${userKey}`

    return hakemus && hakemus["user-key"] ?
      <span className="decision">
        <a href={publicUrl}
           data-test-id="selvitys-link"
           target="_blank"
           rel="noopener noreferrer">
          Linkki lomakkeelle
        </a>
        <HelpTooltip content={helpText} direction={"arviointi"}/>
      </span>
      : <span/>
  }
}
