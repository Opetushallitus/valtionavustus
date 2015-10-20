const _ = require('lodash')
const verboseAssert = require('assert')
import { assert } from 'chai'
import JsUtil from '../form/JsUtil.js'
import InputValueStorage  from '../form/InputValueStorage.js'
import TestUtil from './TestUtil.js'

var answersObject = {}
const formContent = TestUtil.testFormJson()

function writeValue(form, answers, fieldId, value) {
  InputValueStorage.writeValue(form, answers,
    { "id": fieldId,
      "field": _.first(JsUtil.flatFilter(formContent, n => { return n.id === fieldId})),
      "value": value
  })
}

describe('Form input that is', function() {
  beforeEach(() => {
    answersObject = {}
  })

  describe('flat values', function() {
    it('can be read and written', function() {
      writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä")
      const v = InputValueStorage.readValue(formContent, answersObject, "organization")
      assert.equal(v, 'Rovaniemen koulutuskuntayhtymä')
    })

    it('can be updated', function() {
      writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "organization"), 'Rovaniemen koulutuskuntayhtymä')
      writeValue(formContent, answersObject, "organization", "Rovaniemen koulutuskuntayhtymä (REDU)")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "organization"), 'Rovaniemen koulutuskuntayhtymä (REDU)')
    })
  })

  describe('growing fieldset values', function() {
    it('can be read and written', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
      const v = InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name")
      assert.equal(v, "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
    })

    it('can be updated', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")

      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
    })

    it('work with several fields in same group', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemijarven.kaupunki@example.com")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.email"), "kemijarven.kaupunki@example.com")
    })

    it('can delete a row', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-2.name", "Jokilaaksojen koulutuskuntayhtymä")

      const otherOrganizationsValue = answersObject.value[0].value
      assert.isArray(otherOrganizationsValue)
      assert.lengthOf(otherOrganizationsValue, 2, JSON.stringify(otherOrganizationsValue))

      const growingParentFields = JsUtil.flatFilter(formContent, n => { return n.id === "other-organizations"})
      InputValueStorage.deleteValue(growingParentFields[0], answersObject, "other-organizations-2" )
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))
    })

    it("do not produce extra content in answers", function() {
      assert.deepEqual(answersObject, {})
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.deepEqual(_.keys(answersObject), ["value"])

      const storedRootValue = answersObject.value
      assert.isArray(storedRootValue)
      assert.lengthOf(storedRootValue, 1, JSON.stringify(storedRootValue))
      const otherOrganizationsItem = storedRootValue[0]
      assert.deepEqual(_.keys(otherOrganizationsItem), ["key", "value", "fieldType"])
      assert.deepEqual(otherOrganizationsItem.key, "other-organizations")
      var otherOrganizationsValue = otherOrganizationsItem.value
      assert.isArray(otherOrganizationsValue)
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))

      const firstOtherOrganizationValue = otherOrganizationsValue[0]
      verboseAssert.deepEqual(firstOtherOrganizationValue.key, "other-organizations-1")
      assert.isArray(firstOtherOrganizationValue.value)
      assert.lengthOf(firstOtherOrganizationValue.value, 1, JSON.stringify(otherOrganizationsValue))
      verboseAssert.deepEqual(firstOtherOrganizationValue, {"key":"other-organizations-1","value":[
        {"key":"other-organizations.other" +
        "-organizations-1.name","value":"Kemijärven kaupunki","fieldType":"textField"}
      ],"fieldType":"growingFieldsetChild"})

      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemi.jarven@kaupun.ki")
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))
      assert.lengthOf(firstOtherOrganizationValue.value, 2, JSON.stringify(otherOrganizationsValue))

      verboseAssert.deepEqual(firstOtherOrganizationValue.value[0].key, "other-organizations.other-organizations-1.name")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[0].value, "Kemijärven kaupunki")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[0].fieldType, "textField")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[1].key, "other-organizations.other-organizations-1.email")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[1].value, "kemi.jarven@kaupun.ki")
      verboseAssert.deepEqual(firstOtherOrganizationValue.value[1].fieldType, "emailField")
    })
  })
})

