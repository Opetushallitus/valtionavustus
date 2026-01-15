import React from 'react'
import { createRoot } from 'react-dom/client'
import * as Bacon from 'baconjs'
import queryString from 'query-string'
import 'soresu-form/web/form/style/theme.css'
import HttpUtil from 'soresu-form/web/HttpUtil'
import FormController from 'soresu-form/web/form/FormController'
import { triggerFieldUpdatesForValidation } from 'soresu-form/web/form/FieldUpdateHandler'
import ResponseParser from 'soresu-form/web/form/ResponseParser'
import VaForm from './VaForm'
import VaUrlCreator from './VaUrlCreator'
import VaComponentFactory from 'soresu-form/web/va/VaComponentFactory'
import VaSyntaxValidator from 'soresu-form/web/va/VaSyntaxValidator'
import VaPreviewComponentFactory from 'soresu-form/web/va/VaPreviewComponentFactory'
import VaBudgetCalculator from 'soresu-form/web/va/VaBudgetCalculator'
import UrlCreator from 'soresu-form/web/form/UrlCreator'
import {
  FormOperations,
  HakijaAvustusHaku,
  InitialSaveStatus,
  SelvitysAppStateLoopState,
  SelvitysAppStateTemplate,
  UrlContent,
} from 'soresu-form/web/form/types/Form'
import { Answers, Field, Form } from 'soresu-form/web/va/types'
import { initializeStateLoop } from 'soresu-form/web/form/FormStateLoop'
import { EnvironmentApiResponse } from 'soresu-form/web/va/types/environment'

const sessionIdentifierForLocalStorageId = new Date().getTime()
const selvitysType =
  location.pathname.indexOf('loppuselvitys') !== -1 ? 'loppuselvitys' : 'valiselvitys'
const query = queryString.parse(location.search)
const selvitysId = query[selvitysType]
const showPreview = query.preview as string
const lang = query.lang
const realPreview = Boolean(location.pathname.includes('esikatselu'))

function containsExistingEntityId(urlContent: UrlContent): boolean {
  const query = urlContent.parsedQuery
  return query[selvitysType] && query[selvitysType].length > 0
}

const responseParser = new ResponseParser({
  getFormAnswers: function (response) {
    return response.submission.answers
  },
})

interface State {
  avustushaku: HakijaAvustusHaku
  saveStatus: InitialSaveStatus
}

type Lang = 'fi' | 'sv'
type SelvitysType = 'valiselvitys' | 'loppuselvitys'

class SelvitysUrlCreator extends UrlCreator {
  constructor(selvitysType: SelvitysType) {
    function entityApiUrl(
      avustusHakuId: number,
      hakemusId?: string,
      hakemusBaseVersion?: number
    ): string {
      return (
        '/api/avustushaku/' +
        avustusHakuId +
        `/selvitys/${selvitysType}/` +
        hakemusId +
        (typeof hakemusBaseVersion === 'number' ? `/${hakemusBaseVersion}` : '')
      )
    }

    const attachmentDirectAccessUrl = function (state: State, field: Field) {
      const avustusHakuId = state.avustushaku.id
      const hakemusId = state.saveStatus.hakemusId
      return (
        '/api/avustushaku/' + avustusHakuId + '/hakemus/' + hakemusId + '/attachments/' + field.id
      )
    }

    const existingSubmissionEditUrl = (
      avustushakuId: string | number,
      selvitysId: string | number,
      lang: Lang
    ) => `/avustushaku/${avustushakuId}/${selvitysType}?${selvitysType}=${selvitysId}&lang=${lang}`

    const urls = {
      formApiUrl: function (formId: string | number) {
        return '/api/form/' + formId
      },
      newEntityApiUrl: function () {
        // loadEntity creates
      },
      editEntityApiUrl: function (state: State) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        return entityApiUrl(avustusHakuId, hakemusId, state.saveStatus.savedObject?.version)
      },
      submitEntityApiUrl: function (state: State) {
        const baseEditUrl = this.editEntityApiUrl(state)
        const isChangeRequest = state.saveStatus.savedObject?.status === 'pending_change_request'
        return baseEditUrl + (isChangeRequest ? '/change-request-response' : '/submit')
      },
      loadEntityApiUrl: function (urlContent: UrlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const selvitysId = query[selvitysType]
        return entityApiUrl(avustusHakuId, selvitysId, undefined)
      },
      existingSubmissionEditUrl,
      existingSubmissionPreviewUrl: function (
        avustushakuId: string | number,
        selvitysId: string | number,
        lang: Lang
      ) {
        return existingSubmissionEditUrl(avustushakuId, selvitysId, lang) + '&preview=true'
      },
      loadAttachmentsApiUrl: function (urlContent: UrlContent) {
        const query = urlContent.parsedQuery
        const avustusHakuId = VaUrlCreator.parseAvustusHakuId(urlContent)
        const hakemusId = query[selvitysType]
        return '/api/avustushaku/' + avustusHakuId + '/hakemus/' + hakemusId + '/attachments'
      },
      attachmentBaseUrl: function (state: State, field: Field) {
        const avustusHakuId = state.avustushaku.id
        const hakemusId = state.saveStatus.hakemusId
        const hakemusVersion = state.saveStatus.savedObject?.version
        return (
          '/api/avustushaku/' +
          avustusHakuId +
          '/hakemus/' +
          hakemusId +
          '/' +
          hakemusVersion +
          '/attachments/' +
          field.id
        )
      },
      attachmentDownloadUrl: attachmentDirectAccessUrl,
      attachmentDeleteUrl: attachmentDirectAccessUrl,
    }
    super(urls)
  }
}

const urlCreator = new SelvitysUrlCreator(selvitysType)
const budgetCalculator = new VaBudgetCalculator((descriptionField: Field, state: Answers | {}) => {
  triggerFieldUpdatesForValidation([descriptionField], state)
})

function onFieldUpdate(state: SelvitysAppStateLoopState, field: Field) {
  if (field.fieldType === 'moneyField' || field.fieldType === 'vaSelfFinancingField') {
    budgetCalculator.handleBudgetAmountUpdate(state, field.id)
  }
}

function isNotFirstEdit(state: SelvitysAppStateLoopState): boolean {
  if (!state.saveStatus.savedObject || !state.saveStatus.savedObject.version) return false

  return state.saveStatus.savedObject.version > 1
}

interface SaveState {
  saveStatus: {
    hakemusId?: string | number
  }
}

function isSaveDraftAllowed(state: SaveState): boolean {
  if (!state.saveStatus.hakemusId) return false

  return typeof state.saveStatus.hakemusId === 'string'
    ? state.saveStatus.hakemusId.length > 0
    : state.saveStatus.hakemusId > 0
}

function createUiStateIdentifier(state: SelvitysAppStateLoopState): string {
  return state.configuration.form.id + '-' + sessionIdentifierForLocalStorageId
}

function printEntityId(state: SelvitysAppStateLoopState) {
  return state.saveStatus.hakemusId
}

const urlContent = { parsedQuery: query, location }
const avustusHakuId: string = VaUrlCreator.parseAvustusHakuId(urlContent)
const avustusHakuP = Bacon.fromPromise<HakijaAvustusHaku>(
  HttpUtil.get(VaUrlCreator.avustusHakuApiUrl(avustusHakuId))
)
const environmentP = Bacon.fromPromise<EnvironmentApiResponse>(
  HttpUtil.get(VaUrlCreator.environmentConfigUrl())
)

function initialStateTemplateTransformation(template: SelvitysAppStateTemplate) {
  template.avustushaku = avustusHakuP
  template.configuration.environment = environmentP
  template.saveStatus.hakemusId = query[selvitysType] as string
}

function onInitialStateLoaded(initialState: SelvitysAppStateLoopState) {
  budgetCalculator.deriveValuesForAllBudgetElementsByMutation(initialState, {
    reportValidationErrors: isNotFirstEdit(initialState),
  })
}

function initFormController() {
  const formP = avustusHakuP.flatMap(function (avustusHaku) {
    return Bacon.fromPromise<Form>(
      HttpUtil.get(
        urlCreator.formApiUrl(
          selvitysType === 'valiselvitys'
            ? avustusHaku.form_valiselvitys
            : avustusHaku.form_loppuselvitys
        )
      )
    )
  })
  const controller = new FormController({
    initialStateTemplateTransformation,
    onInitialStateLoaded,
    formP,
    customComponentFactory: new VaComponentFactory(),
    customPreviewComponentFactory: new VaPreviewComponentFactory(),
    customFieldSyntaxValidator: VaSyntaxValidator,
  })
  const formOperations: FormOperations<SelvitysAppStateLoopState> = {
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
  const stateProperty = initializeStateLoop<SelvitysAppStateLoopState>(
    controller,
    formOperations,
    initialValues,
    urlContent
  )
  return {
    stateProperty,
    getReactComponent: function getReactComponent(state: SelvitysAppStateLoopState) {
      const isValiselvitys = selvitysType === 'valiselvitys'
      const selvitysUpdateable =
        state.saveStatus.savedObject && state.saveStatus.savedObject['selvitys-updatable']
      const valiselvitysNotUpdateable = isValiselvitys && selvitysUpdateable === false
      if (!showPreview && valiselvitysNotUpdateable) {
        const previewUrl = formOperations.urlCreator.existingSubmissionPreviewUrl(
          state.avustushaku?.id,
          state.saveStatus.hakemusId,
          lang
        )

        window.location.href = previewUrl
      }

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
          hakemusType={selvitysType}
          useBusinessIdSearch={false}
          isExpired={false}
          readOnly={readOnly}
        />
      )
    },
  }
}

function redirectToNewSelvitys(
  avustusHakuId: string,
  hakemusId: string,
  selvitysType: SelvitysType,
  showPreview: string
) {
  HttpUtil.get(
    '/api/avustushaku/' + avustusHakuId + `/selvitys/${selvitysType}/init/` + hakemusId
  ).then((response) => {
    const hakemusId = response.id
    const hakemusLang = lang ? lang : response.language
    window.location.href =
      `/avustushaku/${avustusHakuId}/${selvitysType}?${selvitysType}=${hakemusId}&lang=${hakemusLang}` +
      (showPreview === 'true' ? '&preview=true' : '')
  })
}

const hakemus = query.hakemus
if (!selvitysId && typeof hakemus === 'string') {
  redirectToNewSelvitys(avustusHakuId, hakemus, selvitysType, showPreview)
} else {
  const app = initFormController()
  const container = document.getElementById('app')
  const root = createRoot(container!)
  app.stateProperty.onValue((state) => {
    root.render(app.getReactComponent(state))
  })
}
