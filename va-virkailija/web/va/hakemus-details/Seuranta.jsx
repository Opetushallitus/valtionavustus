import React from 'react'
import PresenterComment from './PresenterComment.jsx'
import SeurantaLiitteet from './SeurantaLiitteet.jsx'
import SeurantaTags from './SeurantaTags.jsx'
import SeurantaBudgetEditing
  from '../seurantabudgetedit/SeurantaBudgetEditing.jsx'
import ShouldPay from './ShouldPay.jsx'
import AllowVisibilityInExternalSystem from './AllowVisibilityInExternalSystem.jsx'
import ShouldPayComments from './ShouldPayComments.jsx'

export default class Seuranta extends React.Component {
  render() {
    const {controller, hakemus, avustushaku,
           translations, hakuData, helpTexts} = this.props
    return (
      <div className="seuranta">
        <AllowVisibilityInExternalSystem controller={controller}
                                         hakemus={hakemus}
                                         allowEditing={true}/>
        <ShouldPay controller={controller}
                   hakemus={hakemus}
                   allowEditing={true}/>
        <ShouldPayComments controller={controller}
                           hakemus={hakemus}
                           allowEditing={true}/>
        <div className="seuranta-section">
          <PresenterComment controller={controller} hakemus={hakemus} helpTexts={helpTexts}/>
          <SeurantaBudgetEditing avustushaku={avustushaku}
                                 hakuData={hakuData}
                                 translations={translations}
                                 controller={controller}
                                 hakemus={hakemus}/>
        </div>
        <div className="seuranta-section">
          <SeurantaLiitteet avustushaku={avustushaku}
                            hakuData={hakuData}
                            translations={translations}
                            controller={controller}
                            hakemus={hakemus}/>
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
