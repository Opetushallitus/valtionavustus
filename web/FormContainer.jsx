import React from 'react'
import Form from './form/Form.jsx'
import FormPreview from './form/FormPreview.jsx'
import FormSaveStatus from './form/FormSaveStatus.jsx'
import FormElementError from './form/FormElementError.jsx'
import ToggleLanguageButton from './form/ToggleLanguageButton.jsx'
import LocalizedString from './form/LocalizedString.jsx'
import UrlCreator from './UrlCreator'
import _ from 'lodash'

export default class FormContainer extends React.Component {
  render() {
    const form = this.props.form
    const avustushaku = this.props.avustushaku
    const model = this.props.model
    const validationErrors = this.props.validationErrors
    const submitErrors = _.get(validationErrors, "submit", [])
    const formIsValid = _.reduce(this.props.clientSideValidation, function (allValid, valid, field) {
      return allValid === true && valid === true
    }, true)
    const saveStatus = this.props.saveStatus
    const values = saveStatus.values
    const configuration = this.props.configuration
    const translations = configuration.translations
    const preview = configuration.preview
    const lang = configuration.lang

    var formElement;

    if (preview) {
      formElement = <FormPreview model={model}
                                 infoElementValues={avustushaku}
                                 form={form}
                                 lang={lang}
                                 translations={translations}
                                 values={values} />
    } else {
      formElement = <Form model={model}
                          validationErrors={validationErrors}
                          infoElementValues={avustushaku}
                          translations={translations}
                          form={form}
                          lang={lang}
                          saved={saveStatus.hakemusId ? true : false}
                          values={values} />
    }
    const openPreview = function() {
      window.open(UrlCreator.existingHakemusPreviewUrl(avustushaku.id, saveStatus.hakemusId), "preview")
    }

    return (
        <div>
          <section id="topbar">
            <div id="top-container">
              <img id="logo" src="img/logo.png"/>
              <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
              <div id="form-controls" hidden={preview}>
                <FormSaveStatus submitErrors={submitErrors} saveStatus={saveStatus} translations={translations} lang={lang}/>
                <button id="submit" type="submit" onClick={model.submit} disabled={!(formIsValid && saveStatus.hakemusId) || saveStatus.changes || saveStatus.saveInProgress}><LocalizedString translations={translations.form} translationKey="submit" lang={lang}/></button>
                <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
                <div id="form-controls-devel" hidden={!configuration.develMode}>
                  <ToggleLanguageButton id="toggle-language" model={model} languages={translations.languages} lang={lang}/>
                  <button type="button" onClick={openPreview} disabled={!saveStatus.hakemusId}><LocalizedString translations={translations.form} translationKey="preview" lang={lang}/></button>
                </div>
              </div>
            </div>
            <span hidden={true} id="hakemus-id">{saveStatus.hakemusId}</span>
            <span hidden={true} id="pending-changes">{(saveStatus.changes || saveStatus.saveInProgress) ? "true" : "false"}</span>
          </section>
          <section id="container">
            {formElement}
          </section>
        </div>
    )
  }
}
