import Bacon from 'baconjs'
import _ from 'lodash'
import qwest from 'qwest'
import Immutable from 'seamless-immutable'

import InputValueStorage from './InputValueStorage.js'
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
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

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

    // Local functions are used to give scope to state transitions and to prevent 'this' from disappearing
    const stateTransitions = new FormStateTransitions(dispatcher, events, queryParams.devel)
    const formFieldValuesP = Bacon.update({},
      [dispatcher.stream(events.initialState)], (...args) => stateTransitions.onInitialState(...args),
      [dispatcher.stream(events.updateField)], (...args) => stateTransitions.onUpdateField(...args),
      [dispatcher.stream(events.fieldValidation)], (...args) => stateTransitions.onFieldValidation(...args),
      [dispatcher.stream(events.changeLanguage)], (...args) => stateTransitions.onChangeLang(...args),
      [dispatcher.stream(events.save)], (...args) => stateTransitions.onSave(...args),
      [dispatcher.stream(events.initAutoSave)], (...args) => stateTransitions.onInitAutoSave(...args),
      [dispatcher.stream(events.saveCompleted)], (...args) => stateTransitions.onSaveCompleted(...args),
      [dispatcher.stream(events.saveError)], (...args) => stateTransitions.onSaveError(...args),
      [dispatcher.stream(events.submit)], (...args) => stateTransitions.onSubmit(...args),
      [dispatcher.stream(events.removeField)], (...args) => stateTransitions.onRemoveField(...args),
      [dispatcher.stream(events.beforeUnload)], (...args) => stateTransitions.onBeforeUnload(...args))


    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function getInitialFormValuesPromise(formOperations, formP, query) {
      if (formOperations.containsExistingEntityId(query)) {
        return Bacon.fromPromise(
          qwest.get(formOperations.urlCreator.existingFormApiUrlFromQuery(query))
        ).map(function(submission){ return submission.answers })
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