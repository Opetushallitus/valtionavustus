import React from 'react'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import LocalizedString from 'soresu-form/web/form/component/LocalizedString'
import Translator from 'soresu-form/web/form/Translator'
import JsUtil from 'soresu-form/web/JsUtil'
import InputValueStorage from 'soresu-form/web/form/InputValueStorage'
import SyntaxValidator, { ValidationError, Validator } from 'soresu-form/web/form/SyntaxValidator'
import VaBudgetCalculator from 'soresu-form/web/va/VaBudgetCalculator'

import EnvironmentInfo from 'soresu-form/web/va/EnvironmentInfo'

import TextButton from 'soresu-form/web/form/component/TextButton'
import FormSaveStatus from 'soresu-form/web/form/component/FormSaveStatus.jsx'
import { FormErrorSummary } from 'soresu-form/web/form/component/FormErrorSummary'
import ServerError from 'soresu-form/web/form/component/ServerError.jsx'
import FormController from 'soresu-form/web/form/FormController'
import { BaseStateLoopState, SavedObject } from 'soresu-form/web/form/types/Form'
import { Field, Avustushaku } from 'soresu-form/web/va/types'
import { Logo } from './Logo'
import { isJotpaAvustushaku } from './jotpa'

interface Props<T extends BaseStateLoopState<T>> {
  controller: FormController<T>
  state: any
  hakemusType: 'loppuselvitys' | 'valiselvitys' | 'hakemus'
  isExpired?: boolean
}

type ValidationErrors = Record<string, ValidationError[]>

interface BudgetCalculatorState {
  form: {
    content: Field[]
    validationErrors: Immutable.ImmutableObject<ValidationErrors>
  }
  saveStatus: {
    values: SavedObject
  }
  avustushaku: Avustushaku
}

function calculateAllValidationErrors(
  formContent: Field[],
  values: SavedObject,
  customFieldSyntaxValidator: typeof Validator,
  avustushaku: Avustushaku
) {
  // Calculate syntax validation errors for all form fields
  const allFields = JsUtil.flatFilter(formContent, (n: Field) => {
    return n && n.id !== undefined && n.fieldClass === 'formField'
  }) as Field[]

  const validationErrors: ValidationErrors = {}
  for (const field of allFields) {
    const value = InputValueStorage.readValue(formContent, values, field.id)
    const errors = SyntaxValidator.validateSyntax(field, value, customFieldSyntaxValidator)
    if (errors && errors.length > 0) {
      validationErrors[field.id] = errors
    }
  }

  // Calculate budget validation errors
  // VaBudgetCalculator mutates the form content, so we need a mutable deep copy
  const mutableFormContent = JSON.parse(JSON.stringify(formContent))
  const budgetCalculator = new VaBudgetCalculator()
  const tempState: BudgetCalculatorState = {
    form: {
      content: mutableFormContent,
      validationErrors: Immutable(validationErrors),
    },
    saveStatus: {
      values: values,
    },
    avustushaku: avustushaku,
  }

  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(tempState, {
    reportValidationErrors: true,
  })

  // Return the merged validation errors (syntax + budget)
  // Convert from immutable back to plain object for compatibility
  return tempState.form.validationErrors.asMutable({ deep: true })
}

const VaFormTopbar = <T extends BaseStateLoopState<T>>(props: Props<T>) => {
  const { controller, state, hakemusType, isExpired } = props
  const saveStatus = state.saveStatus
  const configuration = state.configuration
  const avustushaku = state.avustushaku
  const form = state.form
  const validationErrors = state.form.validationErrors
  const allValidationErrors = calculateAllValidationErrors(
    configuration.form.content,
    saveStatus.values,
    state.extensionApi.customFieldSyntaxValidator,
    avustushaku
  )
  const lang = configuration.lang
  const translations = configuration.translations
  const formTranslator = new Translator(translations.form)
  const preview = configuration.preview
  const formIsValidOnClientSide = _.reduce(
    validationErrors,
    (allValid, fieldErrors) => allValid && fieldErrors.length === 0,
    true
  )
  const formIsValidOnServerSide =
    state.saveStatus.savedObject &&
    _.reduce(
      state.saveStatus.savedObject['validation-errors'],
      (allValid, fieldErrors) => allValid && fieldErrors.length === 0,
      true
    )
  const formOperations = state.extensionApi.formOperations
  const previewUrl = formOperations.urlCreator.existingSubmissionPreviewUrl(
    avustushaku.id,
    state.saveStatus.hakemusId,
    lang,
    state.token
  )
  const isNormalEdit = () =>
    _.includes(['new', 'draft', 'submitted'], _.get(saveStatus.savedObject, 'status'))
  const isChangeRequestResponse = () =>
    'pending_change_request' === _.get(saveStatus.savedObject, 'status')
  const isInVirkailijaEditMode = () => 'officer_edit' === _.get(saveStatus.savedObject, 'status')
  const isInApplicantEditMode = () => 'applicant_edit' === _.get(saveStatus.savedObject, 'status')
  const isSubmitted = () => 'submitted' === _.get(saveStatus.savedObject, 'status')
  const isSubmitDisabled = function () {
    return (
      !(
        formIsValidOnClientSide &&
        formIsValidOnServerSide &&
        controller.isSaveDraftAllowed(state)
      ) ||
      controller.hasPendingChanges(state) ||
      isSubmitted()
    )
  }
  const submitTextKey = isSubmitted() ? `submitted-${hakemusType}` : 'submit'
  const hasEnded = avustushaku.phase === 'ended'
  const topicKey = `heading-${hakemusType}`
  const isHakemus = hakemusType === 'hakemus'
  const selvitysUpdateable = saveStatus?.savedObject?.['selvitys-updatable']
  const isValiselvitys = hakemusType === 'valiselvitys'
  const isLoppuselvitys = hakemusType === 'loppuselvitys'
  // selvitys-updatable can be undefined, we only care if its false
  const selvitysNotUpdateable = (isValiselvitys || isLoppuselvitys) && selvitysUpdateable === false
  const previewOrSelvitysNotUpdateable = preview || selvitysNotUpdateable
  const showJotpaLogo = isHakemus && isJotpaAvustushaku(avustushaku['operational-unit-code'])
  const helpText = formTranslator.translate(
    `savehelp-${hakemusType}${showJotpaLogo ? '-jotpa' : ''}`,
    lang
  )

  return (
    <section id="topbar">
      <div id="top-container">
        <Logo showJotpaLogo={showJotpaLogo} lang={lang} />
        <div className="topbar-right">
          <div className="topbar-title-and-save-status">
            <h1 id="topic">
              <LocalizedString
                translations={translations.form}
                translationKey={topicKey}
                lang={lang}
              />
            </h1>
            <FormSaveStatus
              saveStatus={saveStatus}
              translations={translations}
              lang={lang}
              hakemusType={hakemusType}
            />
          </div>
          {!previewOrSelvitysNotUpdateable && (
            <div id="form-controls">
              {isNormalEdit() && (
                <div className="form-control soresu-tooltip soresu-tooltip-down">
                  <TextButton
                    htmlId="submit"
                    onClick={controller.submit}
                    disabled={isSubmitDisabled()}
                    translations={translations.form}
                    translationKey={submitTextKey}
                    lang={lang}
                  />
                  <span className="form-control-button-tooltip">{helpText}</span>
                </div>
              )}
              {isChangeRequestResponse() && (
                <div className="form-control soresu-tooltip soresu-tooltip-down">
                  <TextButton
                    htmlId="change-request-response"
                    onClick={controller.submit}
                    disabled={isSubmitDisabled()}
                    translations={translations.form}
                    translationKey="change-request-response"
                    lang={lang}
                  />
                  <span className="form-control-button-tooltip">
                    {formTranslator.translate('change-request-response-help', lang)}
                  </span>
                </div>
              )}
              {isInVirkailijaEditMode() && (
                <div className="form-control soresu-tooltip soresu-tooltip-down">
                  <TextButton
                    htmlId="virkailija-edit-submit"
                    onClick={controller.submit}
                    disabled={isSubmitDisabled()}
                    translations={translations.form}
                    translationKey="virkailija-edit-submit"
                    lang={lang}
                  />
                  <span className="form-control-button-tooltip">
                    {formTranslator.translate('virkailija-edit-submit-help', lang)}
                  </span>
                </div>
              )}
              {isInApplicantEditMode() && (
                <div className="form-control soresu-tooltip soresu-tooltip-down">
                  <TextButton
                    htmlId="applicant-edit-submit"
                    onClick={controller.submit}
                    disabled={isSubmitDisabled()}
                    translations={translations.form}
                    translationKey="virkailija-edit-submit"
                    lang={lang}
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <div className="important-info">
              <EnvironmentInfo environment={configuration.environment} lang={lang} />
              {isHakemus && hasEnded && (
                <LocalizedString
                  htmlId="avustushaku-has-ended-message"
                  translations={translations.form}
                  translationKey="has-ended"
                  lang={lang}
                />
              )}
              {(!isHakemus && isExpired) ||
                (selvitysNotUpdateable && (
                  <div>
                    <LocalizedString
                      translations={translations.form}
                      translationKey="form-is-expired"
                      lang={lang}
                      keyValues={{
                        formtype: Translator.translateKey(
                          translations.form,
                          isValiselvitys ? 'form-middle' : 'form-final',
                          lang
                        ),
                      }}
                    />
                  </div>
                ))}
              <ServerError
                serverError={saveStatus.serverError}
                translations={translations.errors}
                lang={lang}
              />
            </div>
            {!previewOrSelvitysNotUpdateable && (
              <FormErrorSummary
                formContent={form.content}
                controller={controller}
                validationErrors={validationErrors}
                translations={translations.errors}
                lang={lang}
              />
            )}
            {preview && (
              <FormErrorSummary
                formContent={configuration.form.content}
                controller={controller}
                validationErrors={allValidationErrors}
                translations={translations.errors}
                lang={lang}
              />
            )}
            {!previewOrSelvitysNotUpdateable && (
              <a className="preview-link" href={previewUrl} target="_blank">
                <LocalizedString
                  translations={translations.form}
                  translationKey="print-version"
                  lang={lang}
                />
              </a>
            )}
          </div>
        </div>
      </div>
      <span hidden={true} id="entity-id">
        {formOperations.printEntityId(state)}
      </span>
      <span hidden={true} id="entity-version">
        {formOperations.responseParser.getSavedVersion(state.saveStatus.savedObject)}
      </span>
      <span hidden={true} id="pending-changes">
        {controller.hasPendingChanges(state) ? 'true' : 'false'}
      </span>
    </section>
  )
}

export default VaFormTopbar
