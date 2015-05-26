import Bacon from 'baconjs'
import _ from 'lodash'
import Dispatcher from './Dispatcher'

import {GET, POST, DELETE} from './request'

const dispatcher = new Dispatcher()

export default class FormModel {

  init() {
    const langP = Bacon.repeatedly(15000, ['sv', 'fi']).merge(Bacon.once('fi'))

    const formP = Bacon.fromCallback(GET, "/api/form/1")
    const formValuesP = Bacon.fromCallback(GET, "/api/form_submission/1")


    const requests = Bacon.combineTemplate({
      form: formP,
      values: formValuesP,
      lang: langP
    }).onValue(setData)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('data')], onData,
                                          [dispatcher.stream('updateField')], onUpdateField)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function onData(values, data) {
      return data
    }

    function onUpdateField(state, fieldUpdate) {
      state.values[fieldUpdate.id] = fieldUpdate.value
      return state
    }

    function setData(data) {
      dispatcher.push('data', data)
    }
  }

  // Public API
  setFieldValue(id, value) {
    dispatcher.push('updateField', {id: id, value: value})
  }
}
