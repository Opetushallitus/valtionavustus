import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import InputValueStorage from './InputValueStorage.js'
import HttpUtil from './HttpUtil.js'
import JsUtil from './JsUtil.js'
import FormStateTransitions from './FormStateTransitions.js'

export default class FormStateLoop {
  constructor(dispatcher, events) {
    this.dispatcher = dispatcher
    this.events = events
  }

  initialize(controller, formOperations, query) {
    const queryParams = {
      lang: query.lang || 'fi',
      preview: query.preview || false,
      devel: query.devel || false
    }
    const clientSideValidationP = controller.formP.map(initClientSideValidationState)
    const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))

    const initialStateTemplate = {
      form: controller.formP,
      saveStatus: {
        changes: false,
        saveInProgress: false,
        saveTime: null,
        saveError: "",
        values: getInitialFormValuesPromise(formOperations, controller.formP, query)
      },
      configuration: {
        preview: queryParams.preview,
        develMode: queryParams.devel,
        lang: queryParams.lang,
        translations: translationsP
      },
      validationErrors: Immutable({}),
      clientSideValidation: clientSideValidationP,
      extensionApi: {
        formOperations: formOperations,
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
      [dispatcher.stream(events.saveError)], stateTransitions.onSaveError,
      [dispatcher.stream(events.submit)], stateTransitions.onSubmit,
      [dispatcher.stream(events.removeField)], stateTransitions.onRemoveField,
      [dispatcher.stream(events.beforeUnload)], stateTransitions.onBeforeUnload)


    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function getInitialFormValuesPromise(formOperations, formP, query) {
      if (formOperations.containsExistingEntityId(query)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.existingFormApiUrlFromQuery(query))
        ).map(formOperations.responseParser.getFormAnswers)
      }
      return formP.map(initDefaultValues)
    }

    function initDefaultValues(form) {
      const values = {}
      const fields = JsUtil.flatFilter(form.content, n => { return !_.isUndefined(n.id) })
      _.forEach(fields, f => {
        if (!_.isEmpty(f.options)) {
          InputValueStorage.writeValue(form.content, values, f.id, f.options[0].value)
        }
      })
      return values
    }

    function initClientSideValidationState(form) {
      const values = {}
      const children = form.children ? form.children : form.content
      for (var i = 0; i < children.length; i++) {
        const field = children[i]
        if (field.type === 'formField') {
          values[field.id] = false
        } else if (field.type === 'wrapperElement') {
          var childValues = initClientSideValidationState(field)
          for (var fieldId in childValues) {
            values[fieldId] = childValues[fieldId]
          }
        }
      }
      return values
    }
  }


}