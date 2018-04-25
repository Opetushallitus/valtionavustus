import React from 'react'
import PresenterComment from './PresenterComment.jsx'
import SeurantaLiitteet from './SeurantaLiitteet.jsx'
import SeurantaTags from './SeurantaTags.jsx'
import SeurantaBudgetEditing from '../seurantabudgetedit/SeurantaBudgetEditing.jsx'
import ShouldPay from './ShouldPay.jsx'
import ShouldPayComments from './ShouldPayComments.jsx'

export default class Seuranta extends React.Component {
  render() {
    const {controller, hakemus, avustushaku, translations, hakuData} = this.props
    const allowEditing = this.props.selectedHakemusAccessControl.allowHakemusStateChanges
    return (
      <div className="seuranta">
        <PresenterComment controller={controller} hakemus={hakemus}/>
        <ShouldPay controller={controller} hakemus={hakemus} allowEditing={allowEditing}/>
        <ShouldPayComments controller={controller} hakemus={hakemus} allowEditing={allowEditing}/>
        <div className="seuranta-section">
          <SeurantaBudgetEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}/>
        </div>
        <div className="seuranta-section">
          <SeurantaLiitteet avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}/>
        </div>
        <div className="seuranta-section">
          <SeurantaTags controller={controller} hakemus={hakemus} hakuData={hakuData}/>
        </div>
      </div>
    )
  }
}
