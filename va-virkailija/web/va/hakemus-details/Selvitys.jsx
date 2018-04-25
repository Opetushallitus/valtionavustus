import React, {Component} from 'react'
import _ from 'lodash'
import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink.jsx'
import SelvitysEmail from './SelvitysEmail.jsx'
import PresenterComment from './PresenterComment.jsx'
import ApplicationPayments from './ApplicationPayments.jsx'

export default class Selvitys extends Component {
  render() {
    const {controller, hakemus, avustushaku, translations, selvitysType,
           userInfo, environment} = this.props
    const multibatchEnabled =
          (environment["multibatch-payments"] &&
           environment["multibatch-payments"]["enabled?"]) || false
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
        {multibatchEnabled && avustushaku.content["multiplemaksuera"] &&
          <ApplicationPayments application={hakemus} grant={avustushaku} payments={hakemus.payments}
                               onAddPayment={controller.addPayment}
                               onRemovePayment={controller.removePayment}/>}
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType={selvitysType} preview={preview} label="Linkki lomakkeelle"/>
        {hasSelvitys && <SelvitysEmail controller={controller}
                                       selvitysType={selvitysType}
                                       hakemus={hakemus}
                                       avustushaku={avustushaku}
                                       selvitysHakemus={selvitysHakemus}
                                       userInfo={userInfo}
                                       lang={selvitysHakemus.language}
                                       translations={translations["selvitys-email"]}/>}
      </div>
    )
  }
}
