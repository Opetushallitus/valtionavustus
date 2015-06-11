import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'
import qwest from 'qwest'
import queryString from 'query-string'

const dispatcher = new Dispatcher()

export default class FormModel {
  init() {
    const query = queryString.parse(location.search)
    const langQueryParam =  query.lang || 'fi'
    const langPreviewParam =  query.preview || false
    const avustusHakuP = Bacon.fromPromise(qwest.get("/api/avustushaku/" + (query.avustushaku || 1)))
    const formP = avustusHakuP.flatMap(function(avustusHaku) {return Bacon.fromPromise(qwest.get("/api/form/" + avustusHaku.id))})
    const formValuesP = query.hakemus ? Bacon.fromPromise(qwest.get("/api/avustushaku/" + (query.avustushaku || 1) + "/hakemus/" + query.hakemus)) : formP.map(initDefaultValues)
    const clientSideValidationP = formP.map(initClientSideValidationState)
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

    const requests = Bacon.combineTemplate({
      avustushaku: avustusHakuP,
      form: formP,
      hakemusId: query.hakemus,
      values: formValuesP,
      preview: langPreviewParam,
      lang: langQueryParam,
      validationErrors: {},
      clientSideValidation: clientSideValidationP,
      translations: translationsP
    }).onValue(setData)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('data')], onData,
                                          [dispatcher.stream('updateField')], onUpdateField,
                                          [dispatcher.stream('fieldValidation')], onFieldValidation,
                                          [dispatcher.stream('changeLanguage')], onChangeLang,
                                          [dispatcher.stream('save')], onSave)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initDefaultValues(form) {
      const values = {}
      const children = form.children ? form.children : form.content
      for(var i=0; i < children.length; i++) {
        const field = children[i]
        if(field.options && field.options.length > 0) {
          values[field.id] = field.options[0].value
        }
        if(field.type === 'wrapperElement') {
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
      for(var i=0; i < children.length; i++) {
        const field = children[i]
        if(field.type === 'formField') {
          values[field.id] = false
        }
        else if(field.type === 'wrapperElement') {
          var childValues = initClientSideValidationState(field)
          for (var fieldId in childValues) {
            values[fieldId] = childValues[fieldId]
          }
        }
      }
      return values
    }

    function onData(state, data) {
      return data
    }

    function onChangeLang(state, lang) {
      state.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      state.values[fieldUpdate.id] = fieldUpdate.value
      if(fieldUpdate.validationErrors) {
        state.validationErrors[fieldUpdate.id] = fieldUpdate.validationErrors
        state.clientSideValidation[fieldUpdate.id] = fieldUpdate.validationErrors.length === 0
      }
      else {
        state.clientSideValidation[fieldUpdate.id] = true
      }
      return state
    }

    function onFieldValidation(state, validation) {
      state.clientSideValidation[validation.id] = validation.valid
      return state
    }

    function handleUnexpectedSaveError(state, method, url, error) {
      console.error(method, url, error)
      state.validationErrors["submit"] = [{error: "unexpected-server-error"}]
      return state
    }

    function handleSaveError(state, status, error, method, url, response) {
      if(status === 400) {
        state.validationErrors = JSON.parse(response)
        state.validationErrors["submit"] = [{error: "validation-errors"}]
        return state
      }
      return handleUnexpectedSaveError(state, method, url, error);
    }

    function saveNew(state) {
      var url = "/api/avustushaku/" + state.avustushaku.id + "/hakemus"
      try {
        qwest.put(url, state.values, {dataType: "json", async: false})
            .then(function(response) {
              console.log("State saved. Response=", response)
              state.hakemusId = response.id
              state.validationErrors["submit"] = []
              setData(state)
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

    function updateOld(state, id) {
      var url = "/api/avustushaku/" + state.avustushaku.id + "/hakemus/" + id
      try {
        qwest.post(url, state.values, {dataType: "json", async: false})
            .then(function(response) {
              console.log("State updated. Response=", response)
              state.validationErrors["submit"] = []
            })
            .catch(function(error) {
              state = handleSaveError(state, this.status, error, this.method, url, this.response)
            })
        return state
      }
      catch(error) {
        return handleUnexpectedSaveError(state, "POST", url, error);
      }
    }

    function onSave(state) {
      if(state.hakemusId) {
        return updateOld(state, state.hakemusId)
      }
      else {
        return saveNew(state)
      }
    }

    function setData(data) {
      dispatcher.push('data', data)
    }
  }

  // Public API
  changeLanguage(lang) {
    dispatcher.push('changeLanguage', lang)
  }

  setFieldValue(id, value, validationErrors) {
    dispatcher.push('updateField', {id: id, value: value, validationErrors: validationErrors})
  }

  setFieldValid(id, valid) {
    dispatcher.push('fieldValidation', {id: id, valid: valid})
  }

  save(event) {
    event.preventDefault()
    dispatcher.push('save')
  }
}
