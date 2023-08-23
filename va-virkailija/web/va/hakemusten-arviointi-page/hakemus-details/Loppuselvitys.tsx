import React from 'react'

import { LoppuselvitysForm } from './LoppuselvitysForm'
import { TaloustarkastusEmail } from './TaloustarkastusEmail'
import SelvitysPreview from './SelvitysPreview'
import SelvitysNotFilled from './SelvitysNotFilled'
import SelvitysLink from './SelvitysLink'
import PresenterComment from './PresenterComment'
import ApplicationPayments from './ApplicationPayments'
import {
  addPayment,
  getLoadedState,
  hasMultibatchPayments,
  removePayment,
} from '../arviointiReducer'
import { useHakemustenArviointiDispatch, useHakemustenArviointiSelector } from '../arviointiStore'
import { useHakemus } from '../useHakemus'
import { useUserRoles } from '../arviointiSelectors'
import MuistutusViesti from './Muistutusviesti'
import { isFeatureEnabled } from 'soresu-form/web/va/types/environment'

const Loppuselvitys = () => {
  const hakemus = useHakemus()
  const loadingHakemus = useHakemustenArviointiSelector(
    (state) => state.arviointi.saveStatus.loadingHakemus
  )
  const { hakuData, helpTexts, userInfo, environment } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  )
  const { avustushaku } = hakuData
  const dispatch = useHakemustenArviointiDispatch()
  const loppuselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).lahetykset.loppuselvitysPyynnotSentAt !== undefined
  )
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(hasMultibatchPayments)
  const { isPresentingOfficer, hakemukselleUkotettuValmistelija } = useUserRoles(hakemus.id)
  const hasSelvitys = !!hakemus.selvitys?.loppuselvitys?.answers
  const selvitysHakemus = hakemus.selvitys?.loppuselvitys
  const form = hakemus.selvitys?.loppuselvitysForm

  const loppuselvitysStatus = hakemus['status-loppuselvitys']

  const loppuselvitys = hakemus.selvitys?.loppuselvitys
  const renderTaloustarkastusEmail =
    loppuselvitysStatus === 'information_verified' || loppuselvitysStatus === 'accepted'
  const presenterCommentHelpText = helpTexts['hankkeen_sivu__loppuselvitys___linkki_lomakkeelle']
  const selvitysLinkHelpText = helpTexts['hankkeen_sivu__loppuselvitys___linkki_lomakkeelle']
  const lang = hakemus.language
  const muistusviestiEnabled = isFeatureEnabled(environment, 'muistutusviesti-loppuselvityksesta')

  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      <div data-test-id="hakemus-details-loppuselvitys">
        <PresenterComment helpText={presenterCommentHelpText} />
        {hasSelvitys && !loadingHakemus && muistusviestiEnabled && (
          <MuistutusViesti avustushaku={avustushaku} hakemus={hakemus} lang={lang} />
        )}
        {hasSelvitys ? (
          <SelvitysPreview
            hakemus={hakemus}
            avustushaku={avustushaku}
            selvitysType="loppuselvitys"
            selvitysHakemus={selvitysHakemus}
            form={form}
          />
        ) : (
          <SelvitysNotFilled avustushaku={avustushaku} selvitysType="loppuselvitys" />
        )}
        {multibatchPaymentsEnabled && (
          <ApplicationPayments
            application={hakemus}
            grant={avustushaku}
            index={2}
            payments={hakemus.payments}
            onAddPayment={(paymentSum: number, index: number) => {
              dispatch(
                addPayment({
                  paymentSum,
                  index,
                  hakemusId: hakemus.id,
                  projectCode: hakemus.project?.code,
                })
              )
            }}
            onRemovePayment={(paymentId: number) =>
              dispatch(removePayment({ paymentId, hakemusId: hakemus.id }))
            }
            readonly={!isPresentingOfficer}
          />
        )}
        <SelvitysLink
          avustushaku={avustushaku}
          hakemus={hakemus}
          selvitysType="loppuselvitys"
          helpText={selvitysLinkHelpText}
          selvitysPyynnotSent={loppuselvitysPyynnotSent}
        />
        {!hasSelvitys && !loadingHakemus && muistusviestiEnabled && (
          <MuistutusViesti avustushaku={avustushaku} hakemus={hakemus} lang={lang} />
        )}
        {hasSelvitys && (
          <LoppuselvitysForm
            hakemus={hakemus}
            avustushaku={avustushaku}
            presenter={hakemukselleUkotettuValmistelija}
            userInfo={userInfo}
          />
        )}
        {loppuselvitys &&
          renderTaloustarkastusEmail &&
          !isFeatureEnabled(environment, 'loppuselvitys-taydennyspyynto') && (
            <TaloustarkastusEmail
              avustushakuId={avustushaku.id}
              hakemus={hakemus}
              loppuselvitys={loppuselvitys}
              lang={lang}
              userInfo={userInfo}
              avustushakuName={avustushaku.content.name[lang]}
            />
          )}
      </div>
    </div>
  )
}

export default Loppuselvitys
