import React from 'react'

import SelvitysPreview from '../common-components/SelvitysPreview'
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
  getLoadedState,
  hasMultibatchPayments,
  removePayment,
} from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'
import { useUserRoles } from '../../arviointiSelectors'

const VäliselvitysTab = () => {
  const hakemus = useHakemus()
  const { hakuData, helpTexts, userInfo } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  )
  const { avustushaku } = hakuData
  const multibatchPaymentsEnabled = useHakemustenArviointiSelector(hasMultibatchPayments)
  const valiselvitysPyynnotSent = useHakemustenArviointiSelector(
    (state) => getLoadedState(state.arviointi).lahetykset.valiselvitysPyynnostSentAt !== undefined
  )
  const presenterCommentHelpText = helpTexts['hankkeen_sivu__arviointi___valmistelijan_huomiot']
  const selvitysLinkHelpText = helpTexts['hankkeen_sivu__väliselvitys___linkki_lomakkeelle']
  const hasSelvitysAnswers = !!hakemus.selvitys?.valiselvitys?.answers
  const valiselvitys = hakemus.selvitys?.valiselvitys
  const form = hakemus.selvitys?.valiselvitysForm
  const { isPresentingOfficer } = useUserRoles(hakemus.id)

  const dispatch = useHakemustenArviointiDispatch()
  return (
    <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
      <div className="selvitys-container" data-test-id="hakemus-details-valiselvitys">
        <PresenterComment helpText={presenterCommentHelpText} />
        {hasSelvitysAnswers ? (
          <SelvitysPreview
            hakemus={hakemus}
            avustushaku={avustushaku}
            selvitysType="valiselvitys"
            selvitysHakemus={valiselvitys}
            form={form}
          />
        ) : (
          <SelvitysNotFilled avustushaku={avustushaku} selvitysType="valiselvitys" />
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
          helpText={selvitysLinkHelpText}
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
