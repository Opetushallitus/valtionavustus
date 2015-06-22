import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'
import UrlCreator from './UrlCreator.js'
import LocalStorage from './LocalStorage.js'
import qwest from 'qwest'
import queryString from 'query-string'

const dispatcher = new Dispatcher()

const events = {
  initialState: 'initialState',
  updateField: 'updateField',
  uiStateUpdate: 'uiStateUpdate',
  fieldValidation: 'fieldValidation',
  changeLanguage: 'changeLanguage',
  save: 'save',
  submit: 'submit'
}

export default class FormModel {
  constructor(props) {
    this.formOperations = props.formOperations
  }

  init() {
    const self = this
    const query = queryString.parse(location.search)
    const langQueryParam =  query.lang || 'fi'
    const previewQueryParam =  query.preview || false
    const develQueryParam =  query.devel || false

    const avustusHakuP = Bacon.fromPromise(qwest.get(UrlCreator.avustusHakuApiUrl(query.avustushaku || 1)))
    const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(qwest.get(UrlCreator.formApiUrl(avustusHaku.id)))})
    const formValuesP = query.hakemus ?
      Bacon.fromPromise(qwest.get(UrlCreator.existingHakemusApiUrl((query.avustushaku || 1), query.hakemus))).map(function(submission){return submission.answers}) :
      formP.map(initDefaultValues)
    const clientSideValidationP = formP.map(initClientSideValidationState)
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

    const initialState = Bacon.combineTemplate({
      avustushaku: avustusHakuP,
      form: formP,
      saveStatus: {
        hakemusId: query.hakemus,
        changes: false,
        saveInProgress: false,
        saveTime: null,
        values: formValuesP
      },
      configuration: {
        preview: previewQueryParam,
        develMode: develQueryParam,
        lang: langQueryParam,
        translations: translationsP
      },
      validationErrors: {},
      clientSideValidation: clientSideValidationP
    })
    initialState.onValue(function(state) { dispatcher.push(events.initialState, state) })

    const autoSave = _.debounce(function(){dispatcher.push(events.save)}, develQueryParam? 100 : 3000)
    function autoSaveIfAllowed(state) {
      if (self.formOperations.isSaveDraftAllowed(state)) {
        state.saveStatus.saveInProgress = true
        autoSave()
      }
    }

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream(events.initialState)], onInitialState,
                                          [dispatcher.stream(events.updateField)], onUpdateField,
                                          [dispatcher.stream(events.uiStateUpdate)], onUiStateUpdated,
                                          [dispatcher.stream(events.fieldValidation)], onFieldValidation,
                                          [dispatcher.stream(events.changeLanguage)], onChangeLang,
                                          [dispatcher.stream(events.save)], onSave,
                                          [dispatcher.stream(events.submit)], onSubmit)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initDefaultValues(form) {
      const values = {}
      const children = form.children ? form.children : form.content
      for(var i=0; i < children.length; i++) {
        const field = children[i]
        if (field.options && field.options.length > 0) {
          values[field.id] = field.options[0].value
        }
        if (field.type === 'wrapperElement') {
          var childValues = initDefaultValues(field)
          for (var fieldId in childValues) {
            values[fieldId] = childValues[fieldId]
          }
        }
      }
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

    function onInitialState(state, realInitialState) {
      return realInitialState
    }

    function onChangeLang(state, lang) {
      state.configuration.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      state.saveStatus.values[fieldUpdate.id] = fieldUpdate.value
      if (fieldUpdate.validationErrors) {
        state.validationErrors[fieldUpdate.id] = fieldUpdate.validationErrors
        state.clientSideValidation[fieldUpdate.id] = fieldUpdate.validationErrors.length === 0
      }
      else {
        state.clientSideValidation[fieldUpdate.id] = true
      }
      const clientSideValidationPassed = state.clientSideValidation[fieldUpdate.id];
      if (clientSideValidationPassed) {
        const onValidCallBacksOfField = self.formOperations.onValidCallbacks[fieldUpdate.id]
        if (onValidCallBacksOfField && onValidCallBacksOfField.length > 0) {
          _.each(onValidCallBacksOfField, function(callBackF) {
            callBackF(state, self, fieldUpdate.id, fieldUpdate.value)
          })
        }
      }
      state.saveStatus.changes = true
      autoSaveIfAllowed(state)
      dispatcher.push(events.uiStateUpdate, fieldUpdate)
      return state
    }

    function onUiStateUpdated(state, fieldUpdate) {
      LocalStorage.save(self.formOperations.createUiStateIdentifier, state, fieldUpdate)
      return state
    }

    function onFieldValidation(state, validation) {
      state.clientSideValidation[validation.id] = validation.validationErrors.length === 0
      if (state.saveStatus.hakemusId) {
        state.validationErrors[validation.id] = validation.validationErrors
      }
      return state
    }

    function handleUnexpectedSaveError(state, method, url, error, submit) {
      if (submit) {
        console.error("Unexpected save error ", error, " in ", method, " to ", url)
        state.validationErrors["submit"] = [{error: "unexpected-submit-error"}]
      } else {
        autoSaveIfAllowed(state)
      }
      return state
    }

    function handleOkSave(state) {
      state.saveStatus.changes = false
      state.saveStatus.saveInProgress = false
      state.saveStatus.saveTime = new Date()
      state.validationErrors["submit"] = []
      return state
    }

    function handleSaveError(state, status, error, method, url, response, submit) {
      state.saveStatus.saveInProgress = false
      if (status === 400) {
        state.validationErrors = JSON.parse(response)
        state.validationErrors["submit"] = [{error: "validation-errors"}]
        return state
      }
      return handleUnexpectedSaveError(state, method, url, error, submit);
    }

    function saveNew(state, onSuccessCallback) {
      var url = UrlCreator.newHakemusApiUrl(state.avustushaku.id)
      try {
        qwest.put(url, state.saveStatus.values, {dataType: "json", async: false})
            .then(function(response) {
              console.log("State saved. Response=", response)
              state.saveStatus.hakemusId = response.id
              state = handleOkSave(state)
              if (onSuccessCallback) {
                onSuccessCallback(state)
              }
            })
            .catch(function(error) {
              state = handleSaveError(state, this.status, error, this.method, url, this.response)
            })
        return state
      }
      catch(error) {
        return handleUnexpectedSaveError(state, "PUT", url, error);
      }
    }

    function updateOld(state, id, submit, onSuccessCallback) {
      var url = UrlCreator.existingHakemusApiUrl(state.avustushaku.id, id)+ (submit ? "/submit" : "")
      try {
        qwest.post(url, state.saveStatus.values, {dataType: "json", async: false})
            .then(function(response) {
              console.log("State updated (submit=", submit, "). Response=", response)
              state = handleOkSave(state)
              if (onSuccessCallback) {
                onSuccessCallback(state)
              }
            })
            .catch(function(error) {
              state = handleSaveError(state, this.status, error, this.method, url, this.response, submit)
            })
        return state
      }
      catch(error) {
        return handleUnexpectedSaveError(state, "POST", url, error, submit);
      }
    }

    function onSave(state, params) {
      const onSuccessCallback = params ? params.onSuccessCallback : undefined
      if (state.saveStatus.hakemusId) {
        return updateOld(state, state.saveStatus.hakemusId, false, onSuccessCallback)
      }
      else {
        return saveNew(state, onSuccessCallback)
      }
    }

    function onSubmit(state) {
      return updateOld(state, state.saveStatus.hakemusId, true)
    }
  }

  // Public API
  changeLanguage(lang) {
    dispatcher.push(events.changeLanguage, lang)
  }

  setFieldValue(id, value, validationErrors) {
    dispatcher.push(events.updateField, {id: id, value: value, validationErrors: validationErrors})
  }

  setFieldValid(id, validationErrors) {
    dispatcher.push(events.fieldValidation, {id: id, validationErrors: validationErrors})
  }

  submit(event) {
    event.preventDefault()
    dispatcher.push(events.submit)
  }

  saveImmediately(callback) {
    dispatcher.push(events.save, { onSuccessCallback: callback })
  }
}
