import React, {Component} from 'react'

import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysLink from './SelvitysLink.jsx'

export default class Loppuselvitys extends Component {
  render() {
    const {hakemus, avustushaku, translations} = this.props
    return(
      <div>
        <SelvitysPreview hakemus={hakemus} avustushaku={avustushaku} translations={translations} selvitysType="loppuselvitys"/>
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType="loppuselvitys" label="Linkki loppuselvitys lomakkeelle"/>
      </div>
    )
  }
}