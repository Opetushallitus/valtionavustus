import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Bacon from 'baconjs'
import queryString from 'query-string'

import HttpUtil from 'soresu-form/web/HttpUtil'
import FormController from 'soresu-form/web/form/FormController'
import { triggerFieldUpdatesForValidation } from 'soresu-form/web/form/FieldUpdateHandler'
import ResponseParser from 'soresu-form/web/form/ResponseParser'
import {
  FormOperations,
  HakijaAvustusHaku,
  InitialStateTemplate,
  SavedObject,
  UrlContent,
  VaAppStateLoopState,
} from 'soresu-form/web/form/types/Form'
import { Field, Form, NormalizedHakemusData } from 'soresu-form/web/va/types'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import VaBudgetCalculator from 'soresu-form/web/va/VaBudgetCalculator'
import { initializeStateLoop } from 'soresu-form/web/form/FormStateLoop'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'
import { Muutoshakemus } from 'soresu-form/web/va/types/muutoshakemus'

import VaForm from './VaForm'
import VaUrlCreator from './VaUrlCreator'

const sessionIdentifierForLocalStorageId = new Date().getTime()

function containsExistingEntityId(urlContent: UrlContent) {
  const query = urlContent.parsedQuery
  return query.hakemus && query.hakemus.length > 0
}

const responseParser = new ResponseParser({
  getFormAnswers: function (response) {
    return response.submission.answers
  },
})

const urlCreator = new VaUrlCreator()
const budgetCalculator = new VaBudgetCalculator(
  (descriptionField: Field, state: VaAppStateLoopState) => {
    triggerFieldUpdatesForValidation([descriptionField], state)
  }
)

function onFieldUpdate(state: VaAppStateLoopState, field: Field) {
  if (field.fieldType === 'moneyField' || field.fieldType === 'vaSelfFinancingField') {
    budgetCalculator.handleBudgetAmountUpdate(state, field.id)
  } else if (field.fieldType === 'fixedMultiplierField') {
    budgetCalculator.handleFixedMultiplierUpdate(state, field.id)
  }
}

function isNotFirstEdit(state: VaAppStateLoopState): boolean {
  return (
    !!state.saveStatus.savedObject &&
    !!state.saveStatus.savedObject.version &&
    state.saveStatus.savedObject.version > 1
  )
}

function isSaveDraftAllowed(state: VaAppStateLoopState): boolean {
  return !!state.saveStatus.hakemusId
}

function createUiStateIdentifier(state: VaAppStateLoopState) {
  return state.configuration.form.id + '-' + sessionIdentifierForLocalStorageId
}

function printEntityId(state: VaAppStateLoopState) {
  return state.saveStatus.hakemusId
}

function isFieldEnabled(state: VaAppStateLoopState, fieldId: string): boolean {
  const fieldsToDisable = [
    'organization',
    'organization-email',
    'business-id',
    'organization-postal-address',
  ]

  if (!fieldsToDisable.includes(fieldId)) {
    return true
  }

  // If it's an disabled field, check if it has a value
  const values = state.saveStatus.values.value
  if (!values) {
    return false
  }
  const fieldValue = values.find((v: { key: string; value: any }) => v.key === fieldId)

  // If the field has a value, disable it
  return !fieldValue || !fieldValue.value || fieldValue.value.trim() === ''
}

const query = queryString.parse(location.search)
const urlContent = { parsedQuery: query, location: location }
const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise<HakijaAvustusHaku>(
  HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId))
)
const environmentP = Bacon.fromPromise<EnvironmentApiResponse>(
  HttpUtil.get(VaUrlCreator.environmentConfigUrl())
)
const normalizedHakemusP = Bacon.fromPromise<NormalizedHakemusData>(
  HttpUtil.get(`/api/avustushaku/${avustusHakuId}/hakemus/${query.hakemus}/normalized`).catch(
    () => undefined
  )
)
const muutoshakemuksetP = Bacon.fromPromise<Muutoshakemus[]>(
  HttpUtil.get(`/api/avustushaku/${avustusHakuId}/hakemus/${query.hakemus}/muutoshakemus`).catch(
    () => []
  )
)

function initialStateTemplateTransformation(template: InitialStateTemplate<VaAppStateLoopState>) {
  template.avustushaku = avustusHakuP
  template.normalizedHakemus = normalizedHakemusP
  template.muutoshakemukset = muutoshakemuksetP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query.hakemus as string
  template.token = query.token as string
}

function isOfficerEdit(savedObject: SavedObject) {
  const params = new URLSearchParams(window.location.search)
  const hasOfficerToken = params.has('officerToken')
  return savedObject.status === 'officer_edit' && hasOfficerToken
}

function isEmptyOrReopenedHakemus(savedObject: SavedObject | null) {
  return (
    !savedObject || savedObject.status === 'pending_change_request' || isOfficerEdit(savedObject)
  )
}

function onInitialStateLoaded(initialState: VaAppStateLoopState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    reportValidationErrors: isNotFirstEdit(initialState),
  })
  const modifyApplication = query['modify-application']
  if (
    !modifyApplication &&
    initialState.avustushaku?.phase !== 'current' &&
    !initialState.configuration.preview &&
    !isEmptyOrReopenedHakemus(initialState.saveStatus.savedObject)
  ) {
    window.location.href = urlCreator.existingSubmissionPreviewUrl(
      initialState.avustushaku?.id,
      initialState.saveStatus.hakemusId,
      initialState.configuration.lang,
      initialState.token
    )
  }
}

function initVaFormController() {
  const formP = avustusHakuP.flatMap(function (avustusHaku) {
    return Bacon.fromPromise<Form>(HttpUtil.get(urlCreator.formApiUrl(avustusHaku.form)))
  })
  const controller = new FormController<VaAppStateLoopState>({
    initialStateTemplateTransformation,
    onInitialStateLoaded,
    formP,
    customComponentFactory: new VaComponentFactory(),
    customPreviewComponentFactory: new VaPreviewComponentFactory(),
    customFieldSyntaxValidator: VaSyntaxValidator,
  })
  const formOperations: FormOperations<VaAppStateLoopState> = {
    chooseInitialLanguage: VaUrlCreator.chooseInitialLanguage,
    containsExistingEntityId,
    onFieldUpdate,
    isSaveDraftAllowed,
    isNotFirstEdit,
    createUiStateIdentifier,
    urlCreator,
    responseParser,
    printEntityId,
  }
  const initialValues = {
    language: VaUrlCreator.chooseInitialLanguage(urlContent),
  }
  const stateProperty = initializeStateLoop<VaAppStateLoopState>(
    controller,
    formOperations,
    initialValues,
    urlContent
  )
  return {
    stateProperty,
    getReactComponent: function getReactComponent(state: VaAppStateLoopState) {
      // Disable specific fields such as those that are fetched from organisation service
      // with business id
      state.extensionApi.formOperations.isFieldEnabled = (fieldId: string) => {
        return isFieldEnabled(state, fieldId)
      }

      const realPreview = Boolean(location.pathname.includes('esikatselu'))
      const selvitysType =
        location.pathname.indexOf('loppuselvitys') !== -1 ? 'loppuselvitys' : 'valiselvitys'
      const preview = state.configuration.preview
      const readOnly =
        !realPreview &&
        (preview ||
          (selvitysType === 'loppuselvitys' &&
            !state.saveStatus.savedObject?.['selvitys-updatable']))
      return (
        <VaForm
          controller={controller}
          state={state}
          readOnly={readOnly}
          hakemusType="hakemus"
          useBusinessIdSearch={true}
          refuseGrant={urlContent.parsedQuery['refuse-grant'] as string | undefined}
          modifyApplication={urlContent.parsedQuery['modify-application'] as string | undefined}
        />
      )
    },
  }
}

const app = initVaFormController()
const container = document.getElementById('app')!
const root = createRoot(container)

app.stateProperty.onValue((state) => {
  root.render(app.getReactComponent(state))
})
