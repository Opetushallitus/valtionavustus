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
    const formP = Bacon.fromPromise(qwest.get("/api/form/" + (query.form || 1)))
    const avustusHakuP = Bacon.fromPromise(qwest.get("/api/avustushaku/" + (query.avustushaku || 1)))
    const formValuesP = query.submission ? Bacon.fromPromise(qwest.get("/api/form/" + (query.form || 1) + "/values/" + query.submission)) : formP.map(initDefaultValues)
    const translationsP = Bacon.fromPromise(qwest.get("/translations.json"))

    const requests = Bacon.combineTemplate({
      avustushaku: avustusHakuP,
      form: formP,
      valuesId: query.submission,
      values: formValuesP,
      preview: langPreviewParam,
      lang: langQueryParam,
      validationErrors: {},
      translations: translationsP
    }).onValue(setData)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('data')], onData,
                                          [dispatcher.stream('updateField')], onUpdateField,
                                          [dispatcher.stream('changeLanguage')], onChangeLang,
                                          [dispatcher.stream('save')], onSave)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initDefaultValues(form) {
      const values = {}
      for(var i=0; i < form.content.fields.length; i++) {
        const field = form.content.fields[i]
        if(field.options && field.options.length > 0) {
          values[field.id] = field.options[0].value
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
      }
      return state
    }

    function handleSaveError(state, status, error, method, url, response) {
      if(status === 400) {
        state.validationErrors = JSON.parse(response)
        state.validationErrors["submit"] = [{error: "validation-errors"}]
      }
      else {
        console.error(method, url, error)
        state.validationErrors["submit"] = [{error: "unexpected-server-error"}]
      }
      return state
    }

    function saveNew(state) {
      var url = "/api/form/" + state.form.id + "/values"
      qwest.put(url, state.values, {dataType: "json", async: false})
          .then(function(response) {
            console.log("State saved. Response=", response)
            state.valuesId = response.id
            state.validationErrors["submit"] = []
            setData(state)
          })
          .catch(function(error) {
            state = handleSaveError(state, this.status, error, this.method, url, this.response)
          })
      return state
    }

    function updateOld(state, id) {
      var url = "/api/form/" + state.form.id + "/values/" + id
      qwest.post(url, state.values, {dataType: "json", async: false})
          .then(function(response) {
            console.log("State updated. Response=" + response)
            state.validationErrors["submit"] = []
          })
          .catch(function(error) {
            state = handleSaveError(state, this.status, error, this.method, url, this.response)
          })
      return state
    }

    function onSave(state) {
      try {
        if(state.valuesId) {
          return updateOld(state, state.valuesId)
        }
        else {
          return saveNew(state)
        }
      }
      catch(error) {
        console.error("Unexpected server error: ", error)
        state.validationErrors["submit"] = [{error: "unexpected-server-error"}]
        return state
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

  save(event) {
    event.preventDefault()
    dispatcher.push('save')
  }
}
