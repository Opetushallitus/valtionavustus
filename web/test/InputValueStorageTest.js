const assert = require('assert')
const InputValueStorage = require('../form/InputValueStorage.js')

describe('Plain values', function() {
  it('can be read and written', function() {
    const answersObject = {}
    const formContent = {}
    InputValueStorage.writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä")
    const v = InputValueStorage.readValue(formContent, answersObject, "organization")
    assert.equal(v, 'Rovaniemen koulutuskuntayhtymä')
  })
})