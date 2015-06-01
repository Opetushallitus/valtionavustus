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
    const formP = Bacon.fromPromise(qwest.get("/api/form/" + query.form || 1))
    const formValuesP = query.application ? Bacon.fromPromise(qwest.get("/api/form/" + query.form + "/values/" + query.application)) : {}

    const requests = Bacon.combineTemplate({
      form: formP,
      valuesId: query.application,
      values: formValuesP,
      lang: langQueryParam
    }).onValue(setData)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('data')], onData,
                                          [dispatcher.stream('updateField')], onUpdateField,
                                          [dispatcher.stream('changeLanguage')], onChangeLang,
                                          [dispatcher.stream('save')], onSave)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function onData(state, data) {
      return data
    }

    function onChangeLang(state, lang) {
      state.lang = lang
      return state
    }

    function onUpdateField(state, fieldUpdate) {
      state.values[fieldUpdate.id] = fieldUpdate.value
      return state
    }

    function saveNew(state) {
      var url = "/api/form/" + state.form.id + "/values"
      qwest.put(url, state.values, {dataType: "json"})
          .then(function(response) {
            console.log("State saved. Id=" + response)
          })
          .catch(function(error, url) {
            console.error('PUT', url, error)
          })
    }

    function updateOld(state, id) {
      var url = "/api/form/" + state.form.id + "/values/" + id
      qwest.post(url, state.values, {dataType: "json"})
          .then(function(response) {
            console.log("State saved")
          })
          .catch(function(error, url) {
            console.error('POST', url, error)
          })
    }

    function onSave(state) {
      if(state.valuesId) {
        updateOld(state, state.valuesId)
      }
      else {
        saveNew(state)
      }
      return state
    }

    function setData(data) {
      dispatcher.push('data', data)
    }
  }

  // Public API
  changeLanguage(lang) {
    dispatcher.push('changeLanguage', lang)
  }

  setFieldValue(id, value) {
    dispatcher.push('updateField', {id: id, value: value})
  }

  save(event) {
    event.preventDefault()
    dispatcher.push('save')
  }
}
