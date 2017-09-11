const _ = require('lodash')
const verboseAssert = require('assert')
import { assert } from 'chai'
import JsUtil from '../JsUtil'
import InputValueStorage  from '../form/InputValueStorage'
import TestUtil from './TestUtil'

var answersObject = {}
const formContent = TestUtil.testFormJson()

function writeValue(form, answers, fieldId, value) {
  InputValueStorage.writeValue(form, answers,
    { "id": fieldId,
      "field": _.first(JsUtil.flatFilter(formContent, n => { return n.id === fieldId})),
      "value": value
  })
}

describe('Input value storage', function() {
  beforeEach(function() {
    answersObject = {}
  })

  it('reading returns empty string for value not found', function() {
    assert.equal(InputValueStorage.readValue(null, answersObject, 'nosuchid'), '')
  })

  describe('flat value', function() {
    it('writes and reads', function() {
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

  describe('checkbox with multiple values', function() {
    it('writes and reads', function() {
      writeValue(formContent, answersObject, 'checkboxButton-0', ['sininen', 'punainen'])
      assert.deepEqual(answersObject, {value: [{
        key: 'checkboxButton-0',
        value: ['sininen', 'punainen'],
        fieldType: 'checkboxButton'
      }]})
      assert.deepEqual(
        InputValueStorage.readValue(formContent, answersObject, 'checkboxButton-0'),
        ['punainen', 'sininen'])
    })

    it('does not mutate answers object when reading and sorting', function() {
      writeValue(formContent, answersObject, 'checkboxButton-0', ['sininen', 'punainen'])
      const expectedAnswersObject = {value: [{
        key: 'checkboxButton-0',
        value: ['sininen', 'punainen'],
        fieldType: 'checkboxButton'
      }]}
      assert.deepEqual(answersObject, expectedAnswersObject)
      InputValueStorage.readValue(formContent, answersObject, 'checkboxButton-0')
      assert.deepEqual(answersObject, expectedAnswersObject)
    })
  })

  describe('growing fieldset values', function() {
    it('writes and reads', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.deepEqual(answersObject, {value: [{
        key: 'other-organizations',
        value: [{
          key: 'other-organizations-1',
          value: [{
            key: 'other-organizations.other-organizations-1.name',
            value: 'Kemijärven kaupunki',
            fieldType: 'textField'
          }],
          fieldType: 'growingFieldsetChild'
        }],
        fieldType: 'growingFieldset'
      }]})

      assert.deepEqual(
        InputValueStorage.readValue(formContent, answersObject, "other-organizations"),
        [{
          key: 'other-organizations-1',
          value: [{
            key: 'other-organizations.other-organizations-1.name',
            value: 'Kemijärven kaupunki',
            fieldType: 'textField'
          }],
          fieldType: 'growingFieldsetChild'
        }]
      )

      assert.deepEqual(
        InputValueStorage.readValue(formContent, answersObject, "other-organizations-1"),
        [{
          key: 'other-organizations.other-organizations-1.name',
          value: 'Kemijärven kaupunki',
          fieldType: 'textField'
        }]
      )

      assert.equal(
        InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"),
        "Kemijärven kaupunki"
      )
    })

    it('updates', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")

      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki, Itä-Lapin ammattiopisto")
    })

    it('work with several fields in the same group', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemijarven.kaupunki@example.com")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.name"), "Kemijärven kaupunki")
      assert.equal(InputValueStorage.readValue(formContent, answersObject, "other-organizations.other-organizations-1.email"), "kemijarven.kaupunki@example.com")
    })

    it('sorts subfields in the same group when reading', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemijarven.kaupunki@example.com")
      assert.deepEqual(answersObject, {value: [{
        key: 'other-organizations',
        value: [{
          key: 'other-organizations-1',
          value: [{
            key: 'other-organizations.other-organizations-1.name',
            value: 'Kemijärven kaupunki',
            fieldType: 'textField'
          },
          {
            key: 'other-organizations.other-organizations-1.email',
            value: 'kemijarven.kaupunki@example.com',
            fieldType: 'emailField'
          }],
          fieldType: 'growingFieldsetChild'
        }],
        fieldType: 'growingFieldset'
      }]})
      assert.deepEqual(InputValueStorage.readValue(null, answersObject, "other-organizations-1"), [
        {
          key: 'other-organizations.other-organizations-1.email',
          value: 'kemijarven.kaupunki@example.com',
          fieldType: 'emailField'
        },
        {
          key: 'other-organizations.other-organizations-1.name',
          value: 'Kemijärven kaupunki',
          fieldType: 'textField'
        }
      ])
    })

    it('does not mutate answers object when reading and sorting subfields in the same group', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.email", "kemijarven.kaupunki@example.com")
      const expectedAnswersObject = {
        value: [{
          key: 'other-organizations',
          value: [{
            key: 'other-organizations-1',
            value: [{
              key: 'other-organizations.other-organizations-1.name',
              value: 'Kemijärven kaupunki',
              fieldType: 'textField'
            },
            {
              key: 'other-organizations.other-organizations-1.email',
              value: 'kemijarven.kaupunki@example.com',
              fieldType: 'emailField'
            }],
            fieldType: 'growingFieldsetChild'
          }],
          fieldType: 'growingFieldset'
        }]
      }
      assert.deepEqual(answersObject, expectedAnswersObject)
      InputValueStorage.readValue(null, answersObject, "other-organizations-1")
      assert.deepEqual(answersObject, expectedAnswersObject)
    })

    it('deletes', function() {
      writeValue(formContent, answersObject, "other-organizations.other-organizations-1.name", "Kemijärven kaupunki")
      writeValue(formContent, answersObject, "other-organizations.other-organizations-2.name", "Jokilaaksojen koulutuskuntayhtymä")

      const otherOrganizationsValue = answersObject.value[0].value
      assert.isArray(otherOrganizationsValue)
      assert.lengthOf(otherOrganizationsValue, 2, JSON.stringify(otherOrganizationsValue))

      const growingParentFields = JsUtil.flatFilter(formContent, n => { return n.id === "other-organizations"})
      InputValueStorage.deleteValue(growingParentFields[0], answersObject, "other-organizations-2" )
      assert.lengthOf(otherOrganizationsValue, 1, JSON.stringify(otherOrganizationsValue))
    })

    it("does not produce extra content in answers", function() {
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

  describe('table field value', function() {
    const tableValue = [['b', '20', '200'], ['a', '10', '100'], ['c', '30', '300']]

    it('writes and reads', function() {
      writeValue(formContent, answersObject, 'art-courses-plan', tableValue)

      const expectedAnswer = {
        key: 'art-courses-plan',
        value: [['b', '20', '200'], ['a', '10', '100'], ['c', '30', '300']],
        fieldType: 'tableField'
      }

      assert.deepEqual(answersObject, {value: [expectedAnswer]})
      assert.deepEqual(InputValueStorage.readValue(null, answersObject, 'art-courses-plan'), expectedAnswer.value)
    })
  })
})
