import React from 'react'

import PresenterComment from './PresenterComment'
import SeurantaLiitteet from './SeurantaLiitteet'
import SeurantaTags from './SeurantaTags'
import SeurantaBudgetEditing from '../seurantabudgetedit/SeurantaBudgetEditing'
import ShouldPay from './ShouldPay'
import AllowVisibilityInExternalSystem from './AllowVisibilityInExternalSystem'
import ShouldPayComments from './ShouldPayComments'
import HakemustenArviointiController from '../HakemustenArviointiController'
import { Avustushaku, Hakemus, HelpTexts, LegacyTranslations } from 'soresu-form/web/va/types'
import { HakuData } from '../types'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'

interface SeurantaProps {
  controller: HakemustenArviointiController
  hakemus: Hakemus
  avustushaku: Avustushaku
  translations: LegacyTranslations
  hakuData: HakuData
  helpTexts: HelpTexts
  muutoshakemukset?: Muutoshakemus[]
}

export default class Seuranta extends React.Component<SeurantaProps> {
  render() {
    const {controller, hakemus, avustushaku, translations, hakuData, helpTexts, muutoshakemukset} = this.props
    return (
      <div className="seuranta">
        <AllowVisibilityInExternalSystem controller={controller}
                                         hakemus={hakemus}
                                         allowEditing={true}
                                         helpText={helpTexts["hankkeen_sivu__seuranta___salli_näkyvyys_ulkoisessa_järjestelmässä"]}/>
        <ShouldPay controller={controller}
                   hakemus={hakemus}
                   allowEditing={true}
                   helpText={helpTexts["hankkeen_sivu__seuranta___maksuun"]}/>
        <ShouldPayComments controller={controller}
                           hakemus={hakemus}
                           allowEditing={true}/>
        <div className="seuranta-section">
          <PresenterComment controller={controller} hakemus={hakemus} helpText={helpTexts["hankkeen_sivu__seuranta___valmistelijan_huomiot"]}/>
          <SeurantaBudgetEditing avustushaku={avustushaku}
                                 hakuData={hakuData}
                                 translations={translations}
                                 controller={controller}
                                 hakemus={hakemus}
                                 muutoshakemukset={muutoshakemukset}/>
        </div>
        <div className="seuranta-section">
          <SeurantaLiitteet avustushaku={avustushaku}
                            hakuData={hakuData}
                            translations={translations}
                            controller={controller}
                            hakemus={hakemus}
                            helpText={helpTexts["hankkeen_sivu__seuranta___liitteet"]}/>
        </div>
        <div className="seuranta-section">
          <SeurantaTags controller={controller}
                        hakemus={hakemus}
                        hakuData={hakuData}/>
        </div>
      </div>
    )
  }
}
