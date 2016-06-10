import React, {Component} from 'react'
import PresenterComment from './PresenterComment.jsx'
import SeurantaLiitteet from './SeurantaLiitteet.jsx'
import SeurantaBudgetEditing from '../seurantabudgetedit/SeurantaBudgetEditing.jsx'

export default class Seuranta extends Component {

  render() {
    const {controller, hakemus, avustushaku, translations, hakuData} = this.props
    return (
      <div className="seuranta">
        <PresenterComment controller={controller} hakemus={hakemus}/>
        <div className="seuranta-section">
          <SeurantaBudgetEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}/>
        </div>
        <div className="seuranta-section">
          <SeurantaLiitteet avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}/>
        </div>
      </div>
    )
  }
}