import React from 'react'
import _ from 'lodash'
import { SelvitysPreview } from './SelvitysPreview'
import SelvitysNotFilled from './SelvitysNotFilled.jsx'
import SelvitysLink from './SelvitysLink.jsx'
import SelvitysEmail from './SelvitysEmail.jsx'
import PresenterComment from './PresenterComment.jsx'
import ApplicationPayments from './ApplicationPayments.jsx'

import { FormikHook } from 'va-common/web/va/standardized-form-fields/types'

interface SelvitysProps {
  controller: any
  hakemus: any
  avustushaku: any
  translations: any
  selvitysType: any
  userInfo: any
  multibatchEnabled: any
  isPresentingOfficer: any
  presenterCommentHelpText: any
  selvitysLinkHelpText: any
  environment: any
  f: FormikHook
}

export const Selvitys = ({controller, hakemus, avustushaku, translations, selvitysType, userInfo, multibatchEnabled, isPresentingOfficer, presenterCommentHelpText, selvitysLinkHelpText, environment, f}: SelvitysProps) => {
    const hasSelvitys = _.has(hakemus,`selvitys.${selvitysType}.answers`)
    const preview = _.isEqual(selvitysType, 'valiselvitys')
    const selvitysHakemus = _.get(hakemus,`selvitys.${selvitysType}`)
    const form = _.get(hakemus,`selvitys.${selvitysType}Form`)
    return(
      <div>
        <PresenterComment controller={controller} hakemus={hakemus} helpText={presenterCommentHelpText}/>
        {!hasSelvitys && <SelvitysNotFilled avustushaku={avustushaku} selvitysType={selvitysType}/>}
        {hasSelvitys && <SelvitysPreview hakemus={hakemus}
                                         avustushaku={avustushaku}
                                         translations={translations}
                                         selvitysType={selvitysType}
                                         selvitysHakemus={selvitysHakemus}
                                         form={form}
                                         environment={environment}
                                         f={f}
        />}
        {multibatchEnabled && avustushaku.content["multiplemaksuera"] &&
          <ApplicationPayments application={hakemus}
                               grant={avustushaku}
                               index={selvitysType === "valiselvitys" ? 1 : 2}
                               payments={hakemus.payments}
                               onAddPayment={controller.addPayment}
                               onRemovePayment={controller.removePayment}
                               readonly={!isPresentingOfficer}/>}
        <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType={selvitysType} preview={preview} label="Linkki lomakkeelle" helpText={selvitysLinkHelpText} />
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
