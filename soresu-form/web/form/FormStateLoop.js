import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import HttpUtil from '../HttpUtil'

import InputValueStorage from './InputValueStorage'
import JsUtil from '../JsUtil'
import MathUtil from '../MathUtil'
import FormStateTransitions from './FormStateTransitions'
import FormRules from './FormRules'
import Translator from './Translator'

export default class FormStateLoop {
  constructor(dispatcher, events) {
    this.dispatcher = dispatcher
    this.events = events
  }

  static initDefaultValues(values, initialValues, formSpecificationContent, lang) {
    function determineInitialValue(field) {
      if (field.id in initialValues) {
        return initialValues[field.id]
      } else if (!_.isUndefined(field.initialValue)) {
        if (_.isObject(field.initialValue)) {
          const translator = new Translator(field)
          return translator.translate("initialValue", lang)
        } else if (MathUtil.isNumeric(field.initialValue)) {
          return field.initialValue.toString()
        }
        return undefined
      }
    }

    const fields = JsUtil.flatFilter(formSpecificationContent, n => { return !_.isUndefined(n.id) })
    _.forEach(fields, f => {
      const currentValueFromState = InputValueStorage.readValue(formSpecificationContent, values, f.id)
      if (currentValueFromState === "") {
        const initialValueForField = determineInitialValue(f)
        if (!_.isUndefined(initialValueForField)) {
          InputValueStorage.writeValue(formSpecificationContent, values,
              { id: f.id,
                field: f,
                value: initialValueForField,
                fieldType: f.fieldType,
                validationErrors: []})
        }
      }
    })
    return values
  }

  initialize(controller, formOperations, initialValues, urlContent) {
    const query = urlContent.parsedQuery
    const queryParams = {
      preview: query.preview || false,
      devel: query.devel || false
    }
    const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json")).map(Immutable)
    const savedObjectP = loadSavedObjectPromise(formOperations, urlContent)
    const existingAttachmentsP = loadAttachmentsPromise(formOperations, urlContent)
    const formP = controller.formP.map(Immutable)
    const lang = formOperations.chooseInitialLanguage(urlContent)
    const initialValuesP = getInitialFormValuesPromise(formOperations, formP, initialValues, savedObjectP, lang)
    const initialFormStateP = initialValuesP.combine(formP, function(values, form) {
      return FormRules.applyRulesToForm(form,
              {
                content: form.content.asMutable({deep: true}),
                validationErrors: Immutable({})
              }, values)
    })

    const initialStateTemplate = {
      form: initialFormStateP,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        serverError: "",
        values: initialValuesP,
        savedObject: savedObjectP,
        attachments: existingAttachmentsP,
        attachmentUploadsInProgress: {}
      },
      configuration: {
        form: formP,
        preview: queryParams.preview === 'true',
        develMode: queryParams.devel === 'true',
        lang: lang,
        translations: translationsP
      },
      extensionApi: {
        formOperations: formOperations,
        customFieldSyntaxValidator: controller.getCustomFieldSyntaxValidator(),
        onInitialStateLoaded: controller.onInitialStateLoaded
      }
    }

    if (_.isFunction(controller.initialStateTemplateTransformation)) {
      controller.initialStateTemplateTransformation(initialStateTemplate)
    }

    const dispatcher = this.dispatcher
    const events = this.events
    const initialState = Bacon.combineTemplate(initialStateTemplate)

    initialState.onValue(function(state) {
      dispatcher.push(events.initialState, state)
    })

    Bacon.fromEvent(window, "beforeunload").onValue(function(event) {
      // For some odd reason Safari always displays a dialog here
      // But it's probably safer to always save the document anyway
      dispatcher.push(events.beforeUnload)
    })

    const stateTransitions = new FormStateTransitions(dispatcher, events, queryParams.devel)
    const formFieldValuesP = Bacon.update({},
      [dispatcher.stream(events.initialState)], stateTransitions.onInitialState,
      [dispatcher.stream(events.updateField)], stateTransitions.onUpdateField,
      [dispatcher.stream(events.fieldValidation)],stateTransitions.onFieldValidation,
      [dispatcher.stream(events.changeLanguage)], stateTransitions.onChangeLang,
      [dispatcher.stream(events.save)], stateTransitions.onSave,
      [dispatcher.stream(events.initAutoSave)], stateTransitions.onInitAutoSave,
      [dispatcher.stream(events.saveCompleted)], stateTransitions.onSaveCompleted,
      [dispatcher.stream(events.serverError)], stateTransitions.onServerError,
      [dispatcher.stream(events.submit)], stateTransitions.onSubmit,
      [dispatcher.stream(events.removeField)], stateTransitions.onRemoveField,
      [dispatcher.stream(events.beforeUnload)], stateTransitions.onBeforeUnload,
      [dispatcher.stream(events.startAttachmentUpload)], stateTransitions.onUploadAttachment,
      [dispatcher.stream(events.attachmentUploadCompleted)], stateTransitions.onAttachmentUploadCompleted,
      [dispatcher.stream(events.startAttachmentRemoval)], stateTransitions.onRemoveAttachment,
      [dispatcher.stream(events.attachmentRemovalCompleted)], stateTransitions.onAttachmentRemovalCompleted)


    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function loadSavedObjectPromise(formOperations, urlContent) {
      if (formOperations.containsExistingEntityId(urlContent)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.loadEntityApiUrl(urlContent))
        )
      }
      return Bacon.constant(null)
    }

    function loadAttachmentsPromise(formOperations, urlContent) {
      if (formOperations.containsExistingEntityId(urlContent)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.loadAttachmentsApiUrl(urlContent))
        )
      }
      return Bacon.constant({})
    }

    function getInitialFormValuesPromise(formOperations, formP, initialValues, savedObjectP, lang) {
      var valuesP = savedObjectP.map(function(savedObject) {
        if(savedObject) {
          return formOperations.responseParser.getFormAnswers(savedObject)
        }
        else {
          return {}
        }
      })
      return valuesP.combine(formP, function(values, form) {
        return FormStateLoop.initDefaultValues(values, initialValues, form.content, lang)
      })
    }
  }

}
