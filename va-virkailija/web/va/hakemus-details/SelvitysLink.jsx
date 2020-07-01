import React, {Component} from 'react'
import HelpTooltip from "../HelpTooltip.jsx"

export default class SelvitysLink extends Component {
  render() {
    const {hakemus, avustushaku, selvitysType, preview, label, helpText} = this.props
    const userKey = hakemus["user-key"]
    const publicUrl = hakemus ? selvitysUrl(avustushaku.id, userKey, selvitysType, preview) : undefined

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

const selvitysUrl = (avustushakuId, hakemusKey, selvitysType, showPreview) =>
  `/selvitys/avustushaku/${avustushakuId}/${selvitysType}?hakemus=${hakemusKey}` + (selvitysType === 'valiselvitys' ? `&preview=${showPreview}`: '')
