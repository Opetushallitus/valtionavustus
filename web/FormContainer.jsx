import React from 'react'
import Form from './Form.jsx'
import FormPreview from './FormPreview.jsx'
import FormElementError from './FormElementError.jsx'
import ToggleLanguageButton from './ToggleLanguageButton.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class FormContainer extends React.Component {

  render() {
    const form = this.props.form
    const avustushaku = this.props.avustushaku
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const validationErrors = this.props.validationErrors
    const submitErrors = _.get(validationErrors, "submit", [])
    const formIsValid = _.reduce(this.props.clientSideValidation, function (allValid, valid, field) {
      return allValid === true && valid === true
    }, true)
    const translations = this.props.translations
    const hakemusId = this.props.hakemusId

    var formElement;

    if (this.props.preview) {
      formElement = <FormPreview model={model} infoElementValues={avustushaku} form={form} lang={lang} translations={translations} values={values} hakemusId={this.props.hakemusId}/>
    } else {
      formElement = <Form model={model} validationErrors={validationErrors} infoElementValues={avustushaku} translations={translations} form={form} lang={lang} values={values} hakemusId={this.props.hakemusId}/>
    }
    const openPreview = function() {
      window.open("/?preview=true&avustushaku=" + avustushaku.id + "&hakemus=" + hakemusId, "preview")
    }

    return (
        <div>
          <section id="topbar">
            <div id="top-container">
              <img id="logo" src="img/logo.png"/>
              <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
              <div id="form-controls" hidden={this.props.preview}>
                <ToggleLanguageButton id="toggle-language" model={model} languages={translations.languages} lang={lang}/>
                <button type="button" onClick={openPreview} disabled={!hakemusId}><LocalizedString translations={translations.form} translationKey="preview" lang={lang}/></button>
                <button type="submit" onClick={model.save} disabled={!formIsValid}><LocalizedString translations={translations.form} translationKey="submit" lang={lang}/></button>
                <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
              </div>
            </div>
          </section>
          <section id="container">
            {formElement}
          </section>
        </div>
    )
  }
}
