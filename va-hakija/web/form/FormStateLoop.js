import Bacon from 'baconjs'
import _ from 'lodash'
import Immutable from 'seamless-immutable'

import InputValueStorage from './InputValueStorage.js'
import HttpUtil from './HttpUtil.js'
import JsUtil from './JsUtil.js'
import FormUtil from './FormUtil.js'
import FormStateTransitions from './FormStateTransitions.js'
import FormRules from './FormRules.js'
import Translator from './Translator.js'

export default class FormStateLoop {
  constructor(dispatcher, events) {
    this.dispatcher = dispatcher
    this.events = events
  }

  initialize(controller, formOperations, initialValues, urlContent) {
    const query = urlContent.parsedQuery
    const queryParams = {
      preview: query.preview || false,
      devel: query.devel || false
    }
    const translationsP = Bacon.fromPromise(HttpUtil.get("/translations.json"))
    const savedObjectP = loadSavedObjectPromise(formOperations, urlContent)
    const formP = controller.formP.map(function(form) {
      return Immutable(form)
    })
    const initialValuesP = getInitialFormValuesPromise(formOperations, formP, initialValues, savedObjectP, lang)
    const appliedForm = initialValuesP.combine(formP, function(values, form) {
      return FormRules.applyRulesToForm(form, form.content.asMutable({deep: true}), values)
    })
    const clientSideValidationP = appliedForm.map(initClientSideValidationState)

    const lang = formOperations.chooseInitialLanguage(urlContent)
    const initialStateTemplate = {
      form: {
        specification: formP,
        content: appliedForm
      },
      saveStatus: {
        changes: false,
        saveInProgress: false,
        saveTime: null,
        serverError: "",
        values: initialValuesP,
        savedObject: savedObjectP
      },
      configuration: {
        preview: queryParams.preview,
        develMode: queryParams.devel,
        lang: lang,
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
      [dispatcher.stream(events.serverError)], stateTransitions.onServerError,
      [dispatcher.stream(events.submit)], stateTransitions.onSubmit,
      [dispatcher.stream(events.removeField)], stateTransitions.onRemoveField,
      [dispatcher.stream(events.beforeUnload)], stateTransitions.onBeforeUnload)


    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function loadSavedObjectPromise(formOperations, urlContent) {
      if (formOperations.containsExistingEntityId(urlContent)) {
        return Bacon.fromPromise(
          HttpUtil.get(formOperations.urlCreator.loadEntityApiUrl(urlContent))
        )
      }
      return Bacon.constant(null)
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
        return initDefaultValues(values, initialValues, form, lang)
      })
    }

    function initDefaultValues(values, initialValues, formContent, lang) {
      function determineInitialValue(field) {
        if (field.id in initialValues) {
          return initialValues[field.id]
        } else if (!_.isEmpty(field.options)) {
          return field.options[0].value
        } else if (!_.isUndefined(field.initialValue)) {
          if (_.isObject(field.initialValue)) {
            const translator = new Translator(field)
            return translator.translate("initialValue", lang)
          } else if (FormUtil.isNumeric(field.initialValue)) {
            return field.initialValue.toString()
          }
          return undefined
        }
      }

      const fields = JsUtil.flatFilter(formContent, n => { return !_.isUndefined(n.id) })
      _.forEach(fields, f => {
        const currentValueFromState = InputValueStorage.readValue(formContent, values, f.id)
        if (currentValueFromState === "") {
          const initialValueForField = determineInitialValue(f, initialValues)
          if (!_.isUndefined(initialValueForField)) {
            InputValueStorage.writeValue(formContent, values, f.id, initialValueForField)
          }
        }
      })
      return values
    }

    function initClientSideValidationState(formContent) {
      const values = {}
      const children = formContent.children ? formContent.children : formContent
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
