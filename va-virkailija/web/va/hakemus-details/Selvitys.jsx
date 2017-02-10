import React, {Component} from 'react'
import _ from 'lodash'
import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink.jsx'
import SelvitysEmail from './SelvitysEmail.jsx'
import PresenterComment from './PresenterComment.jsx'

export default class Selvitys extends Component {
  render() {
    const {controller, hakemus, avustushaku, translations, selvitysType, userInfo} = this.props
    const hasSelvitys = _.has(hakemus,`selvitys.${selvitysType}.answers`)
    const preview = _.eq(selvitysType, 'valiselvitys')
    const selvitysHakemus = _.get(hakemus,`selvitys.${selvitysType}`)
    const form = _.get(hakemus,`selvitys.${selvitysType}Form`)
    return(
      <div>
        <PresenterComment controller={controller} hakemus={hakemus}/>
        {!hasSelvitys && <SelvitysNotFilled avustushaku={avustushaku} selvitysType={selvitysType}/>}
        {hasSelvitys && <SelvitysPreview hakemus={hakemus}
                                         avustushaku={avustushaku}
                                         translations={translations}
                                         selvitysType={selvitysType}
                                         selvitysHakemus={selvitysHakemus}
                                         form={form}

        />}
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType={selvitysType} preview={preview} label="Linkki lomakkeelle"/>
        {hasSelvitys && <SelvitysEmail controller={controller} selvitysType={selvitysType} hakemus={hakemus} avustushaku={avustushaku} selvitysHakemus={selvitysHakemus} userInfo={userInfo}/>}
      </div>
    )
  }
}