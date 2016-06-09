import React, {Component} from 'react'
import PresenterComment from './PresenterComment.jsx'
import SeurantaBudgetEditing from '../seurantabudgetedit/SeurantaBudgetEditing.jsx'

export default class Seuranta extends Component {

  render() {
    const {controller, hakemus, avustushaku, translations, hakuData} = this.props
    return (
      <div>
        <PresenterComment controller={controller} hakemus={hakemus}/>
        <SeurantaBudgetEditing avustushaku={avustushaku} hakuData={hakuData} translations={translations} controller={controller} hakemus={hakemus}/>
      </div>
    )
  }
}