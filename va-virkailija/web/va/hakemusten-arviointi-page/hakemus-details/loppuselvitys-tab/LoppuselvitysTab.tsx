import React from 'react'

import { LoppuselvitysForm } from './LoppuselvitysForm'
import { SelvitysPreview } from '../common-components/SelvitysPreview'
import SelvitysNotFilled from '../common-components/SelvitysNotFilled'
import SelvitysLink from '../common-components/SelvitysLink'
import PresenterComment from '../common-components/PresenterComment'
import ApplicationPayments from '../common-components/ApplicationPayments'
import {
  addPayment,
  getLoadedAvustushakuData,
  hasMultibatchPayments,
  removePayment,
} from '../../arviointiReducer'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import { useHakemus } from '../../useHakemus'
import { useUserRoles } from '../../arviointiSelectors'
import MuistutusViesti from './Muistutusviesti'
import { useUserInfo } from '../../../initial-data-context'

const LoppuselvitysTab = () => {
  const hakemus = useHakemus()
  const loadingHakemus = useHakemustenArviointiSelector(
    (state) => state.arviointi.loadStatus.loadingHakemusId !== null
  )
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedAvustushakuData(state.arviointi)
  )
  const userInfo = useUserInfo()

  const { avustushaku } = hakuData
  const dispatch = useHakemustenArviointiDispatch()
  const loppuselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) =>
      getLoadedAvustushakuData(state.arviointi).lahetykset.loppuselvitysPyynnotSentAt !== undefined
  )
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(hasMultibatchPayments)
  const { isPresentingOfficer, hakemukselleUkotettuValmistelija } = useUserRoles(hakemus.id)
  const hasSelvitys = !!hakemus.selvitys?.loppuselvitys?.answers
  const selvitysHakemus = hakemus.selvitys?.loppuselvitys
  const form = hakemus.selvitys?.loppuselvitysForm

  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      <div data-test-id="hakemus-details-loppuselvitys">
        <PresenterComment helpTextKey="hankkeen_sivu__loppuselvitys___linkki_lomakkeelle" />
        {hasSelvitys && !loadingHakemus && (
          <MuistutusViesti avustushaku={avustushaku} hakemus={hakemus} />
        )}
        {hasSelvitys ? (
          <SelvitysPreview
            hakemus={hakemus}
            avustushaku={avustushaku}
            selvitysType="loppuselvitys"
            selvitysHakemus={{
              ...selvitysHakemus,
              changeRequests: hakemus.selvitys?.loppuselvitysChangeRequests,
            }}
            form={form}
          />
        ) : (
          <SelvitysNotFilled avustushaku={avustushaku} selvitysType="Loppuselvitys" />
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
          helpTextKey="hankkeen_sivu__loppuselvitys___linkki_lomakkeelle"
          selvitysPyynnotSent={loppuselvitysPyynnotSent}
        />
        {!hasSelvitys && !loadingHakemus && (
          <MuistutusViesti avustushaku={avustushaku} hakemus={hakemus} />
        )}
        {hasSelvitys && (
          <LoppuselvitysForm
            hakemus={hakemus}
            avustushaku={avustushaku}
            presenter={hakemukselleUkotettuValmistelija}
            userInfo={userInfo}
          />
        )}
      </div>
    </div>
  )
}

export default LoppuselvitysTab
