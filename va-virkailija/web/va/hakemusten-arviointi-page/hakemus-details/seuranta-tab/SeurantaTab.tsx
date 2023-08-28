import React from 'react'

import PresenterComment from '../common-components/PresenterComment'
import SeurantaLiitteet from './SeurantaLiitteet'
import SeurantaTags from './SeurantaTags'
import SeurantaBudgetEditing from './seurantabudgetedit/SeurantaBudgetEditing'
import ShouldPay from './ShouldPay'
import KeskeytaAloittamatta from './KeskeytaAloittamatta'
import AllowVisibilityInExternalSystem from './AllowVisibilityInExternalSystem'
import ShouldPayComments from './ShouldPayComments'
import { useHakemustenArviointiSelector } from '../../arviointiStore'
import { getLoadedState } from '../../arviointiReducer'
import { useHakemus } from '../../useHakemus'
import { useUserInfo } from '../../../initial-data-context'

const SeurantaTab = () => {
  const hakemus = useHakemus()
  const { helpTexts, hakuData } = useHakemustenArviointiSelector((state) =>
    getLoadedState(state.arviointi)
  )
  const userInfo = useUserInfo()
  const { avustushaku } = hakuData
  const { muutoshakemukset } = hakemus
  return (
    <>
      <KeskeytaAloittamatta
        hakemus={hakemus}
        disabled={!userInfo.privileges.includes('va-admin')}
      />
      <div id="tab-content" className={hakemus.refused ? 'disabled' : ''}>
        <div className="seuranta">
          <AllowVisibilityInExternalSystem
            hakemus={hakemus}
            allowEditing={true}
            helpText={
              helpTexts['hankkeen_sivu__seuranta___salli_näkyvyys_ulkoisessa_järjestelmässä']
            }
          />
          <ShouldPay
            hakemus={hakemus}
            allowEditing={true}
            helpText={helpTexts['hankkeen_sivu__seuranta___maksuun']}
          />
          <ShouldPayComments />
          <div className="seuranta-section">
            <PresenterComment
              helpText={helpTexts['hankkeen_sivu__seuranta___valmistelijan_huomiot']}
            />
            <SeurantaBudgetEditing
              avustushaku={avustushaku}
              hakuData={hakuData}
              hakemus={hakemus}
              muutoshakemukset={muutoshakemukset}
            />
          </div>
          <div className="seuranta-section">
            <SeurantaLiitteet
              avustushaku={avustushaku}
              hakuData={hakuData}
              hakemus={hakemus}
              helpText={helpTexts['hankkeen_sivu__seuranta___liitteet']}
            />
          </div>
          <div className="seuranta-section">
            <SeurantaTags hakemus={hakemus} />
          </div>
        </div>
      </div>
    </>
  )
}

export default SeurantaTab
