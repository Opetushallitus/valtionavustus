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
    const infoElementValues = this.props.infoElementValues
    const lang = this.props.lang
    const model = this.props.model
    const values = this.props.values
    const validationErrors = this.props.validationErrors
    const submitErrors = _.get(validationErrors, "submit", [])
    const formIsValid = _.reduce(this.props.clientSideValidation, function (allValid, valid, field) {
      return allValid === true && valid === true
    }, true)
    const translations = this.props.translations
    const valuesId = this.props.valuesId

    var formElement;

    if (this.props.preview) {
      formElement = <FormPreview model={model} infoElementValues={infoElementValues} form={form} lang={lang} translations={translations} values={values} valuesId={this.props.valuesId}/>
    } else {
      formElement = <Form model={model} validationErrors={validationErrors} infoElementValues={infoElementValues} translations={translations} form={form} lang={lang} values={values} valuesId={this.props.valuesId}/>
    }
    const openPreview = function() {
      window.open("/?preview=true&form=" + form.id + "&submission=" + valuesId, "preview")
    }

    return (
        <div>
          <section id="topbar">
            <div id="top-container">
              <img id="logo" src="img/logo.png"/>
              <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
              <div id="form-controls" hidden={this.props.preview}>
                <ToggleLanguageButton id="toggle-language" model={model} languages={translations.languages} lang={lang}/>
                <button type="button" onClick={openPreview} disabled={!valuesId}><LocalizedString translations={translations.form} translationKey="preview" lang={lang}/></button>
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
