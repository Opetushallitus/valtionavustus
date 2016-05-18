import React, {Component} from 'react'
import _ from 'lodash'
import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink.jsx'
import SelvitysEmail from './SelvitysEmail.jsx'

export default class Selvitys extends Component {
  render() {
    const {hakemus, avustushaku, hakuData, translations,selvitysType} = this.props
    const hasSelvitys = _.has(hakemus,`selvitys.${selvitysType}.answers`)
    const selvitysHakemus = _.get(hakemus,`selvitys.${selvitysType}`)
    const form = _.get(hakemus,`selvitys.${selvitysType}Form`)
    return(
      <div>
        {!hasSelvitys && <SelvitysNotFilled avustushaku={avustushaku} selvitysType={selvitysType}/>}
        {hasSelvitys && <SelvitysPreview hakemus={hakemus}
                                         avustushaku={avustushaku}
                                         translations={translations}
                                         selvitysType={selvitysType}
                                         selvitysHakemus={selvitysHakemus}
                                         form={form}

        />}
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType={selvitysType} label="Linkki lomakkeelle"/>
        {hasSelvitys && <SelvitysEmail avustushaku={avustushaku} selvitysHakemus={selvitysHakemus} hakuData={hakuData}/>}
      </div>
    )
  }
}