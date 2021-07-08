import React, {Component} from 'react'
import HelpTooltip from "../HelpTooltip"
import { Avustushaku, Hakemus } from 'va-common/web/va/types'

type SelvitysLinkProps = {
  hakemus: Hakemus
  avustushaku: Avustushaku
  selvitysType: 'valiselvitys' | 'loppuselvitys'
  label: string
  helpText: string
}

export default class SelvitysLink extends Component<SelvitysLinkProps> {
  render() {
    const {hakemus, avustushaku, selvitysType, label, helpText} = this.props
    const userKey = hakemus["user-key"]
    const publicUrl = `/selvitys/avustushaku/${avustushaku.id}/${selvitysType}?hakemus=${userKey}`

    return hakemus && hakemus["user-key"] ?
      <span className="decision">
        <a href={publicUrl}
           target="_blank"
           rel="noopener noreferrer">
          {label}
        </a>
        <HelpTooltip content={helpText} direction={"arviointi"}/>
      </span>
      : <span/>
  }
}
