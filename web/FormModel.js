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
      saveStatus: {
        hakemusId: query.hakemus,
        changes: false,
        saveTime: null
      },
      values: formValuesP,
      preview: langPreviewParam,
      lang: langQueryParam,
      validationErrors: {},
      clientSideValidation: clientSideValidationP,
      translations: translationsP
    }).onValue(setData)

    const autoSave = _.debounce(function(){dispatcher.push('save')}, 5000)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('data')], onData,
                                          [dispatcher.stream('updateField')], onUpdateField,
                                          [dispatcher.stream('fieldValidation')], onFieldValidation,
                                          [dispatcher.stream('changeLanguage')], onChangeLang,
                                          [dispatcher.stream('save')], onSave,
                                          [dispatcher.stream('submit')], onSubmit)

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
      state.saveStatus.changes = true
      autoSave()
      return state
    }

    function onFieldValidation(state, validation) {
      state.clientSideValidation[validation.id] = validation.valid
      return state
    }

    function handleUnexpectedSaveError(state, method, url, error) {
      console.error("Unexpected save error ", error, " in ", method, " to ", url)
      state.validationErrors["submit"] = [{error: "unexpected-server-error"}]
      return state
    }

    function handleOkSave(state) {
      state.saveStatus.changes = false
      state.saveStatus.saveTime = new Date()
      state.validationErrors["submit"] = []
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
              state.saveStatus.hakemusId = response.id
              state = handleOkSave(state)
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

    function updateOld(state, id, submit) {
      var url = "/api/avustushaku/" + state.avustushaku.id + "/hakemus/" + id + (submit ? "/submit" : "")
      try {
        qwest.post(url, state.values, {dataType: "json", async: false})
            .then(function(response) {
              console.log("State updated (submit=", submit, "). Response=", response)
              state = handleOkSave(state)
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
      if(state.saveStatus.hakemusId) {
        return updateOld(state, state.saveStatus.hakemusId, false)
      }
      else {
        return saveNew(state)
      }
    }

    function onSubmit(state) {
      return updateOld(state, state.saveStatus.hakemusId, true)
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

  submit(event) {
    event.preventDefault()
    dispatcher.push('submit')
  }
}
