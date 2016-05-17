import React, {Component} from 'react'

import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysLink from './SelvitysLink.jsx'

export default class Valiselvitys extends Component {
  render() {
    const {hakemus, avustushaku, translations} = this.props
    return(
      <div>
        <SelvitysPreview hakemus={hakemus} avustushaku={avustushaku} translations={translations} selvitysType="valiselvitys"/>
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType="valiselvitys" label="Linkki väliselvitys lomakkeelle"/>
      </div>
    )
  }
}