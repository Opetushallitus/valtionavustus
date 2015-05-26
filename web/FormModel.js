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
    }).onValue(setInitialData)

    const formFieldValuesP = Bacon.update({},
                                          [dispatcher.stream('initialData')], initialData,
                                          [dispatcher.stream('updateField')], updateField)

    return formFieldValuesP.filter((value) => { return !_.isEmpty(value) })

    function initialData(values, data) {
      console.log("Initial data received", data)
      return data
    }

    function updateField(values, update) {
      return values[update.id] = update.value
    }

    function setInitialData(data) {
        dispatcher.push('initialData', data)
    }
  }

  // Public
  setFieldValue(id, value) {
    dispatcher.push('updateField', {id: id, value: value})
  }
}
