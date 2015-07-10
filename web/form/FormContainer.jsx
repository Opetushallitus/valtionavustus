import React from 'react'
import Form from './Form.jsx'
import FormPreview from './FormPreview.jsx'
import FormSaveStatus from './FormSaveStatus.jsx'
import FormElementError from './FormElementError.jsx'
import ToggleLanguageButton from './ToggleLanguageButton.jsx'
import LocalizedString from './LocalizedString.jsx'
import _ from 'lodash'

export default class FormContainer extends React.Component {
  render() {
    const state = this.props.state
    const form = this.props.form
    const infoElementValues = this.props.infoElementValues
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
                                 infoElementValues={infoElementValues}
                                 form={form}
                                 lang={lang}
                                 translations={translations}
                                 values={values} />
    } else {
      formElement = <Form model={model}
                          validationErrors={validationErrors}
                          infoElementValues={infoElementValues}
                          translations={translations}
                          form={form}
                          lang={lang}
                          saved={model.isSaveDraftAllowed(state)}
                          values={values}
                          state={state}/>
    }
    const openPreview = function() {
      window.open(model.formOperations.urlCreator.existingSubmissionPreviewUrl(state), "preview")
    }

    return (
        <div>
          <section id="topbar">
            <div id="top-container">
              <img id="logo" src="img/logo.png"/>
              <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
              <div id="form-controls" hidden={preview}>
                <FormSaveStatus submitErrors={submitErrors} saveStatus={saveStatus} translations={translations} lang={lang}/>
                <button id="submit" type="submit" className="textButton" onClick={model.submit} disabled={!(formIsValid && model.isSaveDraftAllowed(state)) || model.hasPendingChanges(state)}><LocalizedString translations={translations.form} translationKey="submit" lang={lang}/></button>
                <FormElementError fieldId="submit" validationErrors={submitErrors} translations={translations} lang={lang}/>
                <div id="form-controls-devel" hidden={!configuration.develMode}>
                  <ToggleLanguageButton id="toggle-language" model={model} languages={translations.languages} lang={lang}/>
                  <button type="button" className="textButton" onClick={openPreview} disabled={!model.isSaveDraftAllowed(state)}><LocalizedString translations={translations.form} translationKey="preview" lang={lang}/></button>
                </div>
              </div>
            </div>
            <span hidden={true} id="entity-id">{model.formOperations.printEntityId(state)}</span>
            <span hidden={true} id="pending-changes">{ model.hasPendingChanges(state) ? "true" : "false"}</span>
          </section>
          <section id="container">
            {formElement}
          </section>
        </div>
    )
  }
}
