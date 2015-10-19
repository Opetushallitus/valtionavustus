import React, { Component } from 'react'
import Immutable from 'seamless-immutable'

import HakemusPreview from '../hakemus-details/HakemusPreview.jsx'

export default class FormEditor extends Component {
  render() {
    const avustushaku = this.props.avustushaku
    const hakuData = Immutable({form: avustushaku.formContent})
    const translations = this.props.translations

    return avustushaku.formContent ?
      <div id="form-editor">
        <h3>Hakulomakkeen muokkaus</h3>
        <HakemusPreview avustushaku={avustushaku} hakuData={hakuData} translations={translations} hakemus={{}}/>
      </div> : <span/>
  }
}
