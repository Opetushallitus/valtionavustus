import React from 'react'

import { SelvitysPreview } from '../common-components/SelvitysPreview'
import SelvitysNotFilled from '../common-components/SelvitysNotFilled'
import SelvitysLink from '../common-components/SelvitysLink'
import PresenterComment from '../common-components/PresenterComment'
import ApplicationPayments from '../common-components/ApplicationPayments'
import { ValiselvitysEmail } from './ValiselvitysEmail'
import {
  useHakemustenArviointiDispatch,
  useHakemustenArviointiSelector,
} from '../../arviointiStore'
import {
  addPayment,
  getLoadedAvustushakuData,
  hasMultibatchPayments,
  removePayment,
} from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'
import { useUserRoles } from '../../arviointiSelectors'
import { useUserInfo } from '../../../initial-data-context'

const VäliselvitysTab = () => {
  const hakemus = useHakemus()
  const { hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedAvustushakuData(state.arviointi)
  )
  const userInfo = useUserInfo()
  const { avustushaku } = hakuData
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(hasMultibatchPayments)
  const valiselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) =>
      getLoadedAvustushakuData(state.arviointi).lahetykset.valiselvitysPyynnostSentAt !== undefined
  )
  const hasSelvitysAnswers = !!hakemus.selvitys?.valiselvitys?.answers
  const valiselvitys = hakemus.selvitys?.valiselvitys
  const form = hakemus.selvitys?.valiselvitysForm
  const { isPresentingOfficer } = useUserRoles(hakemus.id)

  const dispatch = useHakemustenArviointiDispatch()
  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      <div className="selvitys-container" data-test-id="hakemus-details-valiselvitys">
        <PresenterComment helpTextKey="hankkeen_sivu__arviointi___valmistelijan_huomiot" />
        {hasSelvitysAnswers ? (
          <SelvitysPreview
            hakemus={hakemus}
            avustushaku={avustushaku}
            selvitysType="valiselvitys"
            selvitysHakemus={valiselvitys}
            form={form}
          />
        ) : (
          <SelvitysNotFilled avustushaku={avustushaku} selvitysType="Väliselvitys" />
        )}
        {multibatchPaymentsEnabled && (
          <ApplicationPayments
            application={hakemus}
            grant={avustushaku}
            index={1}
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
          selvitysType="valiselvitys"
          helpTextKey="hankkeen_sivu__väliselvitys___linkki_lomakkeelle"
          selvitysPyynnotSent={valiselvitysPyynnotSent}
        />
        {valiselvitys && hasSelvitysAnswers && (
          <ValiselvitysEmail
            hakemus={hakemus}
            avustushaku={avustushaku}
            valiselvitys={valiselvitys}
            userInfo={userInfo}
            lang={hakemus.language}
          />
        )}
      </div>
    </div>
  )
}

export default VäliselvitysTab
