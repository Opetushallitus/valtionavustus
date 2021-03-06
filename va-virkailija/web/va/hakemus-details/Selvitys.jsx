import React, {Component} from 'react'
import _ from 'lodash'
import SelvitysPreview from './SelvitysPreview.jsx'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink'
import SelvitysEmail from './SelvitysEmail.jsx'
import PresenterComment from './PresenterComment.jsx'
import ApplicationPayments from './ApplicationPayments.jsx'

export default class Selvitys extends Component {
  render() {
    const {controller, hakemus, avustushaku, translations, selvitysType,
           userInfo, multibatchEnabled, isPresentingOfficer, presenterCommentHelpText, selvitysLinkHelpText} = this.props
    const hasSelvitys = _.has(hakemus,`selvitys.${selvitysType}.answers`)
    const selvitysHakemus = _.get(hakemus,`selvitys.${selvitysType}`)
    const form = _.get(hakemus,`selvitys.${selvitysType}Form`)
    return(
      <div data-test-id={`hakemus-details-${selvitysType}`}>
        <PresenterComment controller={controller} hakemus={hakemus} helpText={presenterCommentHelpText}/>
        {!hasSelvitys && <SelvitysNotFilled avustushaku={avustushaku} selvitysType={selvitysType}/>}
        {hasSelvitys && <SelvitysPreview hakemus={hakemus}
                                         avustushaku={avustushaku}
                                         translations={translations}
                                         selvitysType={selvitysType}
                                         selvitysHakemus={selvitysHakemus}
                                         form={form}

        />}
        {multibatchEnabled && avustushaku.content["multiplemaksuera"] &&
          <ApplicationPayments application={hakemus}
                               grant={avustushaku}
                               index={selvitysType === "valiselvitys" ? 1 : 2}
                               payments={hakemus.payments}
                               onAddPayment={controller.addPayment}
                               onRemovePayment={controller.removePayment}
                               readonly={!isPresentingOfficer}/>}
        <SelvitysLink avustushaku={avustushaku}
                      hakemus={hakemus}
                      selvitysType={selvitysType}
                      label="Linkki lomakkeelle"
                      helpText={selvitysLinkHelpText} />
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
