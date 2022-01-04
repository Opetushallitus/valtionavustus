import React from 'react'

import SelvitysPreview from './SelvitysPreview'
import SelvitysNotFilled from './SelvitysNotFilled'
import SelvitysLink from './SelvitysLink'
import PresenterComment from './PresenterComment'
import ApplicationPayments from './ApplicationPayments'
import { Avustushaku, Hakemus } from 'va-common/web/va/types'
import HakemustenArviointiController from '../HakemustenArviointiController'
import { Role, UserInfo } from '../types'
import { EnvironmentApiResponse } from 'va-common/web/va/types/environment'
import SelvitysEmail from './SelvitysEmail'

type SelvitysProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  avustushaku: Avustushaku
  translations: any
  userInfo: UserInfo
  multibatchEnabled: boolean
  isPresentingOfficer: boolean
  presenterCommentHelpText: any
  selvitysLinkHelpText: any
  environment: EnvironmentApiResponse
  presenter?: Role
}

const Väliselvitys = ({ controller, hakemus, avustushaku, translations, userInfo, multibatchEnabled, isPresentingOfficer, presenterCommentHelpText, selvitysLinkHelpText }: SelvitysProps) => {
  const hasSelvitys = !!hakemus.selvitys?.valiselvitys?.answers
  const selvitysHakemus = hakemus.selvitys?.valiselvitys
  const form = hakemus.selvitys?.valiselvitysForm

  return (
    <div className="selvitys-container" data-test-id="hakemus-details-valiselvitys">
      <PresenterComment controller={controller} hakemus={hakemus} helpText={presenterCommentHelpText}/>
      {hasSelvitys
        ? <SelvitysPreview hakemus={hakemus}
                            avustushaku={avustushaku}
                            translations={translations}
                            selvitysType='valiselvitys'
                            selvitysHakemus={selvitysHakemus}
                            form={form} />
        : <SelvitysNotFilled avustushaku={avustushaku} selvitysType='valiselvitys'/>}
      {multibatchEnabled && (avustushaku.content as any).multiplemaksuera &&
        <ApplicationPayments application={hakemus}
                              grant={avustushaku}
                              index={1}
                              payments={hakemus.payments}
                              onAddPayment={controller.addPayment}
                              onRemovePayment={controller.removePayment}
                              readonly={!isPresentingOfficer}/>}
      <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType='valiselvitys' helpText={selvitysLinkHelpText} />
      {hasSelvitys && <SelvitysEmail
        controller={controller}
        selvitysType='valiselvitys'
        hakemus={hakemus}
        avustushaku={avustushaku}
        selvitysHakemus={selvitysHakemus}
        userInfo={userInfo}
        translations={translations["selvitys-email"]}
        />}
    </div>
  )
}

export default Väliselvitys