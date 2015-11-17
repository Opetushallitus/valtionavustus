import React from 'react'
import _ from 'lodash'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString.jsx'
import Translator from 'soresu-form/web/form/Translator.js'

import EnvironmentInfo from 'va-common/web/va/EnvironmentInfo.jsx'

import TextButton from 'soresu-form/web/form/component/TextButton.jsx'
import FormSaveStatus from 'soresu-form/web/form/component/FormSaveStatus.jsx'
import ToggleLanguageButton from 'soresu-form/web/form/component/ToggleLanguageButton.jsx'
import FormErrorSummary from 'soresu-form/web/form/component/FormErrorSummary.jsx'
import ServerError from 'soresu-form/web/form/component/ServerError.jsx'

export default class VaFormTopbar extends React.Component {
  render() {
    const controller = this.props.controller
    const state = this.props.state
    const saveStatus = state.saveStatus
    const configuration = state.configuration
    const avustushaku = state.avustushaku
    const form = state.form
    const validationErrors = state.form.validationErrors
    const lang = configuration.lang
    const translations = configuration.translations
    const formTranslator = new Translator(translations.form)
    const preview = configuration.preview
    const formIsValidOnClientSide = _.reduce(state.form.validationErrors, function (allValid, fieldErrors) {
      return allValid === true && fieldErrors.length === 0
    }, true)
    const formIsValidOnServerSide = state.saveStatus.savedObject && _.reduce(state.saveStatus.savedObject["validation-errors"], function (allValid, fieldErrors) {
      return allValid === true && fieldErrors.length === 0
    }, true)
    const formOperations = state.extensionApi.formOperations
    const openPreview = function() {
      window.open(formOperations.urlCreator.existingSubmissionPreviewUrl(state), "preview")
    }
    const isChangeRequestResponse = function() {
      return saveStatus.savedObject && saveStatus.savedObject.status === "pending_change_request"
    }
    const isSubmitted = function() {
      return saveStatus.savedObject && saveStatus.savedObject.status === "submitted"
    }
    const isSubmitDisabled = function() {
      return !(formIsValidOnClientSide && formIsValidOnServerSide && controller.isSaveDraftAllowed(state)) || controller.hasPendingChanges(state) || isSubmitted()
    }
    const submitTextKey = isSubmitted() ? "submitted" : "submit"
    const helpText = formTranslator.translate("savehelp", lang)
    const hasEnded = avustushaku.phase === "ended"

    return(
      <section id="topbar">
        <div id="top-container">
          <img id="logo" src="img/logo.png"/>
          <h1 id="topic"><LocalizedString translations={translations.form} translationKey="heading" lang={lang}/></h1>
          <div id="form-controls" hidden={preview}>
            <FormSaveStatus saveStatus={saveStatus} translations={translations} lang={lang}/>
            <span hidden={isChangeRequestResponse()} className="soresu-tooltip soresu-tooltip-down">
              <TextButton htmlId="submit" onClick={controller.submit} disabled={isSubmitDisabled()} translations={translations.form} translationKey={submitTextKey} lang={lang} />
              <span>{helpText}</span>
            </span>
            <span hidden={!isChangeRequestResponse()} className="soresu-tooltip soresu-tooltip-down">
              <TextButton htmlId="change-request-response" onClick={controller.submit} disabled={isSubmitDisabled()} translations={translations.form} translationKey="change-request-response" lang={lang} />
              <span>{formTranslator.translate("change-request-response-help", lang)}</span>
            </span>
            <span id="form-controls-devel" hidden={!configuration.develMode}>
              <ToggleLanguageButton id="toggle-language" controller={controller} languages={translations.languages} lang={lang}/>
              <TextButton htmlId="preview-button" onClick={openPreview} disabled={!controller.isSaveDraftAllowed(state)} translations={translations.form} translationKey="preview" lang={lang} />
            </span>
            <FormErrorSummary formContent={form.content} controller={controller} validationErrors={validationErrors} translations={translations.errors} lang={lang} />
          </div>
          <div id="server-info">
            <EnvironmentInfo environment={configuration.environment}/>
            <LocalizedString translations={translations.form} translationKey="has-ended" lang={lang} hidden={!hasEnded} />
            <ServerError serverError={saveStatus.serverError} translations={translations.errors} lang={lang}/>
          </div>
        </div>
        <span hidden={true} id="entity-id">{formOperations.printEntityId(state)}</span>
        <span hidden={true} id="entity-version">{formOperations.responseParser.getSavedVersion(state.saveStatus.savedObject)}</span>
        <span hidden={true} id="pending-changes">{ controller.hasPendingChanges(state) ? "true" : "false"}</span>
      </section>
    )
  }
}
