import React, {Component} from 'react'
import PaatosUrl from './PaatosUrl'

export default class SelvitysLink extends Component {
  render() {
    const {hakemus, avustushaku, selvitysType, label} = this.props
    const userKey = hakemus["user-key"]
    const publicUrl = hakemus ? SelvitysUrl.selvitys(avustushaku.id, userKey, selvitysType) : undefined

    return hakemus && hakemus["user-key"] ?
      <span className="decision">
        <a href={publicUrl} target="_blank">{label}</a>
      </span>
      : <span/>
  }
}

class SelvitysUrl {

  static loppuselvitys(avustushakuId, userKey) {
    return selvitys(avustushakuId, userKey, "loppuselvitys")
  }

  static valiselvitys(avustushakuId, userKey) {
    return selvitys(avustushakuId, userKey, "valiselvitys")
  }

  static selvitys(avustushakuId, hakemusKey, selvitysType) {
    return `/selvitys/avustushaku/${avustushakuId}/${selvitysType}?hakemus=${hakemusKey}`
  }
}
