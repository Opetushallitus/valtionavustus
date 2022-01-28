import React from 'react'

import { LoppuselvitysForm } from './LoppuselvitysForm'
import { TaloustarkastusEmail } from './TaloustarkastusEmail'
import SelvitysPreview from './SelvitysPreview'
import SelvitysNotFilled from './SelvitysNotFilled'
import SelvitysLink from './SelvitysLink'
import PresenterComment from './PresenterComment'
import ApplicationPayments from './ApplicationPayments'
import { Avustushaku, Hakemus, LegacyTranslations } from 'soresu-form/web/va/types'
import HakemustenArviointiController from '../HakemustenArviointiController'
import { Role, UserInfo } from '../types'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

type SelvitysProps = {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  avustushaku: Avustushaku
  translations: LegacyTranslations
  userInfo: UserInfo
  multibatchEnabled: boolean
  isPresentingOfficer: boolean
  presenterCommentHelpText: string
  selvitysLinkHelpText: string
  environment: EnvironmentApiResponse
  presenter?: Role
}

const Loppuselvitys = ({ presenter, controller, hakemus, avustushaku, translations, userInfo, multibatchEnabled, isPresentingOfficer, presenterCommentHelpText, selvitysLinkHelpText }: SelvitysProps) => {
  const hasSelvitys = !!hakemus.selvitys?.loppuselvitys?.answers
  const selvitysHakemus = hakemus.selvitys?.loppuselvitys
  const form = hakemus.selvitys?.loppuselvitysForm

  const loppuselvitysStatus = hakemus["status-loppuselvitys"]

  const loppuselvitys = hakemus.selvitys?.loppuselvitys
  const renderTaloustarkastusEmail = loppuselvitysStatus === 'information_verified' || loppuselvitysStatus === 'accepted'

  const lang = loppuselvitys?.language || "fi"
  return (
    <div className="selvitys-container" data-test-id="hakemus-details-loppuselvitys">
      <PresenterComment controller={controller} hakemus={hakemus} helpText={presenterCommentHelpText}/>
      {hasSelvitys
        ? <SelvitysPreview hakemus={hakemus}
                            avustushaku={avustushaku}
                            translations={translations}
                            selvitysType='loppuselvitys'
                            selvitysHakemus={selvitysHakemus}
                            form={form} />
        : <SelvitysNotFilled avustushaku={avustushaku} selvitysType='loppuselvitys'/>}
      {multibatchEnabled && (avustushaku.content as any).multiplemaksuera &&
        <ApplicationPayments application={hakemus}
                              grant={avustushaku}
                              index={2}
                              payments={hakemus.payments}
                              onAddPayment={controller.addPayment}
                              onRemovePayment={controller.removePayment}
                              readonly={!isPresentingOfficer}/>}
      <SelvitysLink avustushaku={avustushaku} hakemus={hakemus} selvitysType='loppuselvitys' helpText={selvitysLinkHelpText} />
      {hasSelvitys && <LoppuselvitysForm controller={controller} hakemus={hakemus} avustushaku={avustushaku} presenter={presenter} userInfo={userInfo} />}
    {loppuselvitys && renderTaloustarkastusEmail && <TaloustarkastusEmail
      controller={controller}
      avustushakuId={avustushaku.id}
      hakemus={hakemus}
      loppuselvitys={loppuselvitys}
      lang={lang}
      userInfo={userInfo}
      avustushakuName={avustushaku.content.name[lang]}
      />}
    </div>
  )
}

export default Loppuselvitys
