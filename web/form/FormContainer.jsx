import React from 'react'
import Form from './Form.jsx'
import FormPreview from './FormPreview.jsx'
import FormSaveStatus from './component/FormSaveStatus.jsx'
import ToggleLanguageButton from './component/ToggleLanguageButton.jsx'
import LocalizedString from './component/LocalizedString.jsx'
import FormErrorSummary from './component/FormErrorSummary.jsx'
import _ from 'lodash'

export default class FormContainer extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const formOperations = state.extensionApi.formOperations
    const infoElementValues = this.props.infoElementValues
    const form = state.form
    const validationErrors = state.validationErrors
    const formIsValid = _.reduce(state.clientSideValidation, function (allValid, valid, field) {
      return allValid === true && valid === true
    }, true)
    const saveStatus = state.saveStatus
    const values = saveStatus.values
    const configuration = state.configuration
    const translations = configuration.translations
    const preview = configuration.preview
    const lang = configuration.lang

    var formElement

    if (preview) {
      formElement = <FormPreview controller={controller}
                                 infoElementValues={infoElementValues}
                                 form={form}
                                 lang={lang}
                                 translations={translations}
                                 values={values}
                                 state={state}/>
    } else {
      formElement = <Form controller={controller}
                          validationErrors={validationErrors}
                          infoElementValues={infoElementValues}
                          translations={translations}
                          form={form}
                          lang={lang}
                          saved={controller.isSaveDraftAllowed(state)}
                          values={values}
                          state={state}/>
    }
    const openPreview = function() {
      window.open(formOperations.urlCreator.existingSubmissionPreviewUrl(state), "preview")
    }

    return (
        <div>
          <section id="topbar">
            <div id="top-container">
              <img id="logo" src="img/logo.png"/>
              <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
              <div id="form-controls" hidden={preview}>
                <FormSaveStatus saveStatus={saveStatus} translations={translations} lang={lang}/>
                <button id="submit" type="submit" className="soresu-text-button" onClick={controller.submit} disabled={!(formIsValid && controller.isSaveDraftAllowed(state)) || controller.hasPendingChanges(state)}>
                  <LocalizedString translations={translations.form} translationKey="submit" lang={lang}/>
                </button>
                <span id="form-controls-devel" hidden={!configuration.develMode}>
                  <ToggleLanguageButton id="toggle-language" controller={controller} languages={translations.languages} lang={lang}/>
                  <button type="button" className="soresu-text-button" onClick={openPreview} disabled={!controller.isSaveDraftAllowed(state)}>
                    <LocalizedString translations={translations.form} translationKey="preview" lang={lang} />
                  </button>
                </span>
                <FormErrorSummary formContent={form.content} controller={controller} saveError={saveStatus.saveError} validationErrors={validationErrors} translations={translations.errors} lang={lang} />
              </div>
            </div>
            <span hidden={true} id="entity-id">{formOperations.printEntityId(state)}</span>
            <span hidden={true} id="pending-changes">{ controller.hasPendingChanges(state) ? "true" : "false"}</span>
          </section>
          <section id="container">
            {formElement}
          </section>
        </div>
    )
  }
}
