import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'

import qwest from 'qwest'

import queryString from 'query-string'

const dispatcher = new Dispatcher()

export default class FormModel {
  init() {

    const langQueryParam =  queryString.parse(location.search).lang || 'fi'
    const formP = Bacon.fromPromise(qwest.get("/api/form/1"))
    const formValuesP = Bacon.fromPromise(qwest.get("/api/form/1/values/1"))

    const requests = Bacon.combineTemplate({
      form: formP,
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

    function onSave(state) {
      var url = "/api/form/1/values/1"
      qwest.post(url, JSON.stringify(state.values))
          .then(function(response) {
            console.log("State saved")
          })
          .catch(function(error, url) {
            console.error('POST', url, error)
          })
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
